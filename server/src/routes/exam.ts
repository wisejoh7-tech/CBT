import { Router } from "express";
import { Brackets } from "typeorm";
import { AppDataSource } from "../data-source";
import { Exam } from "../entities/Exam";
import { Question } from "../entities/Question";
import { Attempt } from "../entities/Attempt";
import { Candidate } from "../entities/Candidate";
import { User } from "../entities/User";
import { authenticateJWT, authorizeRoles } from "../middleware/auth";
import {
  analyzeProctoringSnapshot,
  generateBulkQuestionsFromSyllabus,
  generatePersonalizedStudyGuide,
  verifyCandidateIdentity,
} from "../lib/gemini";
import { createLog, logger } from "../lib/logger";
import { sendEmailSafely } from "../lib/services";
import { config } from "../lib/config";

const router = Router();

// --- EXAM ROUTES ---
router.get("/", authenticateJWT, async (req, res) => {
  const exams = await AppDataSource.getRepository(Exam).find({
    order: { createdAt: "DESC" },
  });
  res.json(exams);
});

router.post("/", authenticateJWT, authorizeRoles("admin", "super_admin"), async (req: any, res) => {
  const examRepo = AppDataSource.getRepository(Exam);

  // Ensure createdBy is a valid UUID by strictly using the authenticated user's ID
  const creatorId = req.user?.id || req.body.createdBy;
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(creatorId);

  const data = {
    ...req.body,
    totalQuestions: req.body.totalQuestions || 0,
    createdBy: isUuid ? creatorId : "00000000-0000-0000-0000-000000000000",
    isActive: req.body.isActive ?? true,
  };

  try {
    const exam = examRepo.create(data);
    await examRepo.save(exam);
    res.status(201).json(exam);
  } catch (error: any) {
    logger.error("Failed to create exam:", error.message);
    res.status(400).json({ message: "Failed to create assessment", error: error.message });
  }
});

router.put("/:id", authenticateJWT, authorizeRoles("admin", "super_admin"), async (req, res) => {
  const examRepo = AppDataSource.getRepository(Exam);
  const exam = await examRepo.findOneBy({ id: req.params.id as any });
  if (!exam) return res.status(404).json({ message: "Exam not found" });
  examRepo.merge(exam, req.body);
  await examRepo.save(exam);
  res.json(exam);
});

router.delete("/:id", authenticateJWT, authorizeRoles("admin", "super_admin"), async (req, res) => {
  await AppDataSource.getRepository(Exam).delete(req.params.id as any);
  res.status(204).send();
});

router.get("/:id", authenticateJWT, async (req, res) => {
  const exam = await AppDataSource.getRepository(Exam).findOne({
    where: { id: req.params.id as any },
    relations: { questions: true },
  });
  if (!exam) return res.status(404).json({ message: "Exam not found" });
  res.json(exam);
});

// --- QUESTION ROUTES ---
router.post("/:id/questions", authenticateJWT, authorizeRoles("admin", "super_admin"), async (req, res) => {
  const exam = await AppDataSource.getRepository(Exam).findOneBy({ id: req.params.id as any });
  if (!exam) return res.status(404).json({ message: "Exam not found" });

  const questionRepo = AppDataSource.getRepository(Question);
  const question = questionRepo.create({ ...req.body, exam });
  await questionRepo.save(question);

  const total = await questionRepo.count({ where: { exam: { id: exam.id } } });
  await AppDataSource.getRepository(Exam).update(exam.id, { totalQuestions: total });

  res.status(201).json(question);
});

router.put("/:examId/questions/:questionId", authenticateJWT, authorizeRoles("admin", "super_admin"), async (req, res) => {
  const questionRepo = AppDataSource.getRepository(Question);
  const question = await questionRepo.findOneBy({ id: req.params.questionId as any });
  if (!question) return res.status(404).json({ message: "Question not found" });

  const { text, options, correctOptionIndex, explanation, imageUrl, topic } = req.body;
  if (text !== undefined) question.text = text;
  if (options !== undefined) question.options = options;
  if (correctOptionIndex !== undefined) question.correctOptionIndex = correctOptionIndex;
  if (explanation !== undefined) question.explanation = explanation;
  if (imageUrl !== undefined) question.imageUrl = imageUrl;
  if (topic !== undefined) question.topic = topic;

  await questionRepo.save(question);
  res.json(question);
});

router.delete("/:examId/questions/:questionId", authenticateJWT, authorizeRoles("admin", "super_admin"), async (req, res) => {
  const questionRepo = AppDataSource.getRepository(Question);
  await questionRepo.delete(req.params.questionId);
  const total = await questionRepo.count({ where: { exam: { id: req.params.examId as any } } });
  await AppDataSource.getRepository(Exam).update(req.params.examId, { totalQuestions: total });
  res.status(204).send();
});

// Bulk Question Upload
router.post("/:id/questions/bulk", authenticateJWT, authorizeRoles("admin", "super_admin"), async (req, res) => {
  const exam = await AppDataSource.getRepository(Exam).findOneBy({ id: req.params.id as any });
  if (!exam) return res.status(404).json({ message: "Exam not found" });

  const questionRepo = AppDataSource.getRepository(Question);
  const questionsData: any[] = Array.isArray(req.body) ? req.body : [req.body];

  // ✅ Create once with flat array
  const entities = questionRepo.create(
    questionsData.map((q: any) => ({ ...q, exam }))
  );
  await questionRepo.save(entities);

  const total = await questionRepo.count({ where: { exam: { id: exam.id } } });
  await AppDataSource.getRepository(Exam).update(exam.id, { totalQuestions: total });

  res.status(201).json({ message: `Successfully added ${entities.length} questions`, questions: entities });
});

// AI: Bulk Generate Questions (Corrected)
router.post("/:id/ai-generate", authenticateJWT, authorizeRoles("admin", "super_admin"), async (req, res) => {
  const { syllabus, count } = req.body;
  const exam = await AppDataSource.getRepository(Exam).findOneBy({ id: req.params.id as any });
  if (!exam) return res.status(404).json({ message: "Exam not found" });

  try {
    const aiQuestions = await generateBulkQuestionsFromSyllabus(syllabus, count || 10);

    if (!aiQuestions || aiQuestions.length === 0) {
      return res.status(400).json({ message: "No AI questions generated" });
    }

    const questionRepo = AppDataSource.getRepository(Question);

    // ✅ Flatten AI output before creating
    const flatQuestions = Array.isArray(aiQuestions[0]) ? aiQuestions.flat() : aiQuestions;

    const entities = questionRepo.create(
      flatQuestions.map((q: any) => ({ ...q, exam }))
    );
    await questionRepo.save(entities);

    const total = await questionRepo.count({ where: { exam: { id: exam.id } } });
    await AppDataSource.getRepository(Exam).update(exam.id, { totalQuestions: total });

    res.status(201).json({ message: `Successfully generated ${entities.length} questions`, questions: entities });
  } catch (error: any) {
    res.status(500).json({ message: error.message || "AI Generation failed" });
  }
});

import { sendSMS } from "../lib/sms";

/**
 * Helper to find candidate for a given attempt, matching by examNumber, id, or email.
 */
export async function findCandidateForAttempt(userId: string): Promise<Candidate | { id: string; examNumber: string; fullName: string; email: string; phoneNumber?: string } | null> {
  if (!userId) return null;
  const cleanId = userId.trim();
  const candidateRepo = AppDataSource.getRepository(Candidate);

  const candidate = await candidateRepo.createQueryBuilder("c")
    .where("LOWER(TRIM(c.examNumber)) = LOWER(:userId)", { userId: cleanId })
    .orWhere("LOWER(TRIM(c.id)) = LOWER(:userId)", { userId: cleanId })
    .orWhere("LOWER(TRIM(c.email)) = LOWER(:userId)", { userId: cleanId })
    .getOne();

  if (candidate) return candidate;

  // Fallback to searching User repository
  const userRepo = AppDataSource.getRepository(User);
  const user = await userRepo.createQueryBuilder("u")
    .where("LOWER(TRIM(u.examNumber)) = LOWER(:userId)", { userId: cleanId })
    .orWhere("LOWER(TRIM(u.id)) = LOWER(:userId)", { userId: cleanId })
    .orWhere("LOWER(TRIM(u.email)) = LOWER(:userId)", { userId: cleanId })
    .getOne();

  if (user) {
    return {
      id: user.id,
      examNumber: user.examNumber || user.id,
      fullName: user.displayName || "Candidate",
      email: user.email,
    };
  }

  return null;
}

/**
 * Dispatches email and SMS notifications to a candidate upon result release.
 */
export async function sendResultReleaseNotifications(
  candidate: Candidate | { fullName: string; email: string; phoneNumber?: string; examNumber?: string },
  attempt: Attempt
): Promise<{ emailSent: boolean; smsSent: boolean }> {
  let emailSent = false;
  let smsSent = false;

  const score = attempt.score ?? 0;
  const totalPossible = attempt.totalPossible ?? 0;
  const candidateName = candidate.fullName || "Candidate";
  const scoreMsg = `VIVI CBT: Hello ${candidateName}, your exam results have been released. Score: ${score}/${totalPossible}. Visit the portal to print your slip.`;

  // Build subject breakdown HTML if present in attempt.results
  let subjectsHtml = "";
  if (attempt.results && attempt.results.subjects && typeof attempt.results.subjects === "object") {
    try {
      const subjectEntries = Object.entries(attempt.results.subjects as Record<string, any>);
      if (subjectEntries.length > 0) {
        const rows = subjectEntries
          .map(([subj, stats]) => {
            const correct = stats && typeof stats === "object" && "correct" in stats ? (stats.correct ?? 0) : (typeof stats === "number" ? stats : 0);
            const total = stats && typeof stats === "object" && "total" in stats ? (stats.total ?? 0) : 0;
            return `
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 8px 12px; font-weight: 500;">${subj}</td>
                <td style="padding: 8px 12px; text-align: right; font-weight: 600; color: #0EA5E9;">${correct} / ${total}</td>
              </tr>
            `;
          })
          .join("");

        subjectsHtml = `
          <div style="margin: 20px 0;">
            <h3 style="font-size: 16px; color: #1e293b; margin-bottom: 10px;">Subject Breakdown</h3>
            <table style="width: 100%; border-collapse: collapse; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
              <thead>
                <tr style="background: #f1f5f9; text-align: left;">
                  <th style="padding: 8px 12px; font-size: 13px; color: #475569;">Subject</th>
                  <th style="padding: 8px 12px; text-align: right; font-size: 13px; color: #475569;">Score</th>
                </tr>
              </thead>
              <tbody>
                ${rows}
              </tbody>
            </table>
          </div>
        `;
      }
    } catch (subjErr) {
      logger.error("Failed to construct subject breakdown HTML:", subjErr);
    }
  }

  const percentage = totalPossible > 0 ? ((score / totalPossible) * 100).toFixed(1) : "0";

  // 1. Send Email Notification
  if (candidate.email) {
    try {
      emailSent = await sendEmailSafely({
        to: candidate.email,
        subject: "OFFICIAL EXAM RESULT RELEASED",
        html: `
          <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; background: #ffffff;">
            <h2 style="color: #0EA5E9; margin-top: 0;">Result Notification</h2>
            <p>Hello <b>${candidateName}</b>,</p>
            <p>Your performance record for the VIVI Standard Examination has been verified and released.</p>
            <div style="background: #f8fafc; padding: 20px; border-radius: 12px; margin: 20px 0; border: 1px solid #e2e8f0;">
              <p style="margin: 0; font-size: 14px; color: #64748b;">AGGREGATE SCORE</p>
              <p style="margin: 5px 0 0 0; font-size: 32px; font-weight: 900; color: #0EA5E9;">${score} / ${totalPossible} <span style="font-size: 18px; color: #64748b; font-weight: normal;">(${percentage}%)</span></p>
            </div>
            ${subjectsHtml}
            <p>You can now log in to your candidate dashboard to view the full breakdown and print your official result slip.</p>
            <p style="font-size: 12px; color: #94a3b8; margin-top: 40px; border-top: 1px solid #f1f5f9; padding-top: 15px;">&copy; 2026 VIVI CBT Systems. This is an automated notification.</p>
          </div>
        `
      });
    } catch (emailErr) {
      logger.error(`Failed to send result email to ${candidate.email}:`, emailErr);
    }
  } else {
    logger.warn(`Candidate ${candidateName} has no email address configured.`);
  }

  // 2. Send Phone SMS Notification
  if (candidate.phoneNumber) {
    try {
      smsSent = await sendSMS(candidate.phoneNumber, scoreMsg);
    } catch (smsErr) {
      logger.error(`Failed to send result SMS to ${candidate.phoneNumber}:`, smsErr);
    }
  } else {
    logger.warn(`Candidate ${candidateName} has no phone number configured.`);
  }

  return { emailSent, smsSent };
}

// --- ATTEMPT ROUTES ---

// Get my attempts
router.get("/attempts/my", authenticateJWT, async (req: any, res) => {
  const userId = req.user.examNumber || req.user.id;
  const attempts = await AppDataSource.getRepository(Attempt).find({
    where: { userId },
    order: { startedAt: "DESC" },
  });
  res.json(attempts);
});

// Get all attempts (Admin)
router.get("/attempts/all", authenticateJWT, authorizeRoles("admin", "super_admin", "reg_admin"), async (req, res) => {
  try {
    const attempts = await AppDataSource.getRepository(Attempt).find({
      order: { startedAt: "DESC" },
      take: 500 // Limit for performance
    });
    res.json(attempts || []);
  } catch (error: any) {
    logger.error("Fetch all attempts error:", error);
    res.status(500).json({ message: "Failed to fetch exam attempts", error: error.message || "Unknown error" });
  }
});

// Release All Completed Results
router.post("/attempts/release-all", authenticateJWT, authorizeRoles("admin", "super_admin"), async (req, res) => {
  try {
    const attemptRepo = AppDataSource.getRepository(Attempt);
    const candidateRepo = AppDataSource.getRepository(Candidate);

    const unreleasedAttempts = await attemptRepo.find({
      where: { status: 'completed', isReleased: false }
    });

    if (unreleasedAttempts.length === 0) {
      return res.json({ message: "No pending unreleased results found.", count: 0 });
    }

    let releasedCount = 0;
    for (const attempt of unreleasedAttempts) {
      try {
        attempt.isReleased = true;
        await attemptRepo.save(attempt);
        releasedCount++;

        const candidate = await findCandidateForAttempt(attempt.userId);
        if (candidate) {
          if ('assignedExamId' in candidate && candidate.assignedExamId) {
            try {
              (candidate as Candidate).assignedExamId = null as any;
              await candidateRepo.save(candidate as Candidate);
            } catch (candSaveErr) {
              logger.warn(`Could not clear assignedExamId for candidate ${candidate.id}:`, candSaveErr);
            }
          }

          try {
            await sendResultReleaseNotifications(candidate, attempt);
          } catch (notifErr) {
            logger.error(`Error sending release notification for attempt ${attempt.id}:`, notifErr);
          }
        } else {
          logger.warn(`No candidate record found for attempt ${attempt.id} (userId: ${attempt.userId}) during batch release.`);
        }
      } catch (attemptErr) {
        logger.error(`Failed to release attempt ${attempt.id}:`, attemptErr);
      }
    }

    await createLog({
      type: "exam",
      severity: "info",
      message: `Batch release completed: ${releasedCount} results published by admin.`,
      userId: (req as any).user?.id
    });

    res.json({ message: `Successfully released ${releasedCount} result(s). Notifications dispatched via email and phone.`, count: releasedCount });
  } catch (error: any) {
    logger.error("Batch release results error:", error);
    res.status(500).json({ message: "Failed to release all results", error: error.message });
  }
});

// Release Results
router.post("/attempts/:id/release", authenticateJWT, authorizeRoles("admin", "super_admin"), async (req, res) => {
  try {
    const attemptRepo = AppDataSource.getRepository(Attempt);
    const candidateRepo = AppDataSource.getRepository(Candidate);

    const attempt = await attemptRepo.findOneBy({ id: req.params.id as any });
    if (!attempt) return res.status(404).json({ message: "Attempt not found" });
    if (attempt.status !== 'completed') return res.status(400).json({ message: "Exam session not yet completed" });

    // Mark as released
    attempt.isReleased = true;
    await attemptRepo.save(attempt);

    // Fetch candidate for notifications and clear assigned active exam
    try {
      const candidate = await findCandidateForAttempt(attempt.userId);

      if (candidate) {
        if ('assignedExamId' in candidate && candidate.assignedExamId) {
          try {
            (candidate as Candidate).assignedExamId = null as any;
            await candidateRepo.save(candidate as Candidate);
          } catch (candSaveErr) {
            logger.warn(`Could not clear assignedExamId for candidate ${candidate.id}:`, candSaveErr);
          }
        }

        await sendResultReleaseNotifications(candidate, attempt);
      } else {
        logger.warn(`No candidate record found for attempt ${attempt.id} (userId: ${attempt.userId}) during release.`);
      }
    } catch (postReleaseErr) {
      logger.error(`Post-release processing (notifications/candidate sync) failed for attempt ${attempt.id}:`, postReleaseErr);
    }

    res.json({ message: "Results released and notifications dispatched via email and phone number." });
  } catch (error: any) {
    logger.error("Release result error:", error);
    res.status(500).json({ message: "Failed to release results", error: error.message });
  }
});

// Reset Attempt (Admin)
router.post("/attempts/:id/reset", authenticateJWT, authorizeRoles("admin", "super_admin"), async (req, res) => {
  try {
    const attemptRepo = AppDataSource.getRepository(Attempt);
    const candidateRepo = AppDataSource.getRepository(Candidate);

    const attempt = await attemptRepo.findOneBy({ id: req.params.id as any });
    if (!attempt) return res.status(404).json({ message: "Attempt not found" });

    // Clear candidate's assigned active exam
    const candidate = await candidateRepo.findOneBy({ examNumber: attempt.userId });
    if (candidate && candidate.assignedExamId) {
      candidate.assignedExamId = null as any;
      await candidateRepo.save(candidate);
    }

    await attemptRepo.remove(attempt);

    await createLog({
      type: "exam",
      severity: "warning",
      message: `Exam attempt ${req.params.id} for user ${attempt.userId} reset by admin.`,
      userId: (req as any).user?.id,
      metadata: { attemptId: req.params.id, candidateId: attempt.userId }
    });

    res.json({ message: "Attempt reset successfully. Active session removed." });
  } catch (error: any) {
    res.status(500).json({ message: "Failed to reset attempt", error: error.message });
  }
});

// Create/Start attempt
router.post("/attempt", authenticateJWT, async (req: any, res) => {
  const userId = req.user.examNumber || req.user.id;
  const attemptRepo = AppDataSource.getRepository(Attempt);

  const attempt = attemptRepo.create({
    ...req.body,
    userId,
    startedAt: new Date(),
    status: 'in-progress'
  });

  await attemptRepo.save(attempt);
  res.status(201).json(attempt);
});

// Update attempt state (Saving progress)
router.put("/attempt/:id", authenticateJWT, async (req, res) => {
  const attemptRepo = AppDataSource.getRepository(Attempt);
  const attempt = await attemptRepo.findOneBy({ id: req.params.id as any });

  if (!attempt) return res.status(404).json({ message: "Attempt not found" });

  // Security: Prevent candidates from releasing their own results via state payload
  const { isReleased, ...safeBody } = req.body;

  attemptRepo.merge(attempt, safeBody);
  await attemptRepo.save(attempt);
  res.json(attempt);
});

// Proctoring: Analyze snapshot
router.post("/attempt/:id/proctoring", authenticateJWT, async (req, res) => {
  const { image } = req.body;
  if (!image) return res.status(400).json({ message: "Image data required" });

  try {
    const analysis = await analyzeProctoringSnapshot(image);
    // Log anomaly if detected
    if (analysis.isAnomaly) {
      await createLog({
        type: "security",
        severity: "warning",
        message: `AI Proctor: Anomaly detected for attempt ${req.params.id}: ${analysis.reason}`,
        userId: (req as any).user?.id,
        metadata: { attemptId: req.params.id, ...analysis }
      });
    }
    res.json(analysis);
  } catch (error: any) {
    res.status(500).json({ message: "AI analysis failed" });
  }
});

// Study Guide: Generate guide
router.get("/attempt/:id/study-guide", authenticateJWT, async (req, res) => {
  const attempt = await AppDataSource.getRepository(Attempt).findOneBy({ id: req.params.id as any });
  if (!attempt || attempt.status !== 'completed') {
    return res.status(400).json({ message: "Attempt not found or not completed" });
  }

  try {
    const guide = await generatePersonalizedStudyGuide(attempt.results);
    res.json(guide);
  } catch (error: any) {
    res.status(500).json({ message: "Study guide generation failed" });
  }
});

// Submit attempt & Auto Marking
router.post("/attempt/:id/submit", authenticateJWT, async (req: any, res) => {
  try {
    const attemptRepo = AppDataSource.getRepository(Attempt);
    const questionRepo = AppDataSource.getRepository(Question);

    const attempt = await attemptRepo.findOneBy({ id: req.params.id as any });
    if (!attempt) return res.status(404).json({ message: "Attempt not found" });
    if (attempt.status === 'completed') return res.status(400).json({ message: "Exam already submitted" });

    const { answers } = req.body;

    let questions: Question[] = [];

    if (attempt.examId === 'unified' as any) {
      // For unified exams, fetch candidate profile to get subjects
      const candidate = await AppDataSource.getRepository(Candidate).findOneBy({ examNumber: attempt.userId });
      const subjectNames = candidate?.subjectCombination || [];

      if (subjectNames.length > 0) {
        // Fetch questions from exams matching subjects with flexible case-insensitive matching
        const query = questionRepo.createQueryBuilder("q")
          .leftJoinAndSelect("q.exam", "exam")
          .where(
            new Brackets(qb => {
              subjectNames.forEach((s, i) => {
                qb.orWhere("LOWER(exam.subject) LIKE LOWER(:s" + i + ")", { ["s" + i]: `%${s.trim()}%` });
              });
            })
          );
        questions = await query.getMany();
      }

      // Fallback: If no questions found by subject combination, load questions from all active exams
      if (questions.length === 0) {
        questions = await questionRepo.find({
          where: { exam: { isActive: true } },
          relations: { exam: true }
        });
      }

      // Fallback: Load all questions from any exam
      if (questions.length === 0) {
        questions = await questionRepo.find({
          relations: { exam: true }
        });
      }
    } else {
      // Specific exam marking
      questions = await questionRepo.find({
        where: { exam: { id: attempt.examId } },
        relations: { exam: true }
      });

      // Fallback if specific exam ID questions not found directly
      if (questions.length === 0) {
        questions = await questionRepo.find({
          relations: { exam: true }
        });
      }
    }

    if (questions.length === 0) {
       return res.status(400).json({ message: "No questions found to mark for this session" });
    }

    let score = 0;
    const totalPossible = questions.length;
    const subjectStats: Record<string, { correct: number, total: number }> = {};
    const topicStats: Record<string, { correct: number, total: number }> = {};

    questions.forEach(q => {
      const studentAnswer = answers[q.id];
      const isCorrect = studentAnswer === q.correctOptionIndex;

      if (isCorrect) score++;

      // Track by topic
      const topic = q.topic || "General";
      if (!topicStats[topic]) topicStats[topic] = { correct: 0, total: 0 };
      topicStats[topic].total++;
      if (isCorrect) topicStats[topic].correct++;

      // Track by subject
      const subject = q.exam?.subject || "General";
      if (!subjectStats[subject]) subjectStats[subject] = { correct: 0, total: 0 };
      subjectStats[subject].total++;
      if (isCorrect) subjectStats[subject].correct++;
    });

    // Update attempt with verified score
    attempt.score = score;
    attempt.totalPossible = totalPossible;
    attempt.status = 'completed';
    attempt.answers = answers;
    attempt.completedAt = new Date();
    attempt.results = {
      topics: topicStats,
      subjects: subjectStats
    };

    await attemptRepo.save(attempt);

    await createLog({
      type: "exam",
      severity: "info",
      message: `Exam submitted by ${attempt.userId}. Score: ${score}/${totalPossible}`,
      userId: attempt.userId,
      metadata: { attemptId: attempt.id, score, totalPossible }
    });

    res.json({ message: "Submission successful", score, totalPossible });
  } catch (error: any) {
    logger.error("Submission marking failed:", error);
    res.status(500).json({ message: "Failed to process submission" });
  }
});

// Public Check Result Endpoint
router.post("/public/check-result", async (req, res) => {
  const { examNumber, attemptId, pin } = req.body;
  if (!examNumber || typeof examNumber !== "string") {
    return res.status(400).json({ message: "Exam number is required" });
  }

  const cleanExamNumber = examNumber.trim().toLowerCase();

  try {
    const candidateRepo = AppDataSource.getRepository(Candidate);
    const candidate = await candidateRepo.createQueryBuilder("c")
      .where("LOWER(c.examNumber) = LOWER(:examNumber)", { examNumber: cleanExamNumber })
      .getOne();

    if (!candidate) {
      return res.status(404).json({ message: "Candidate record not found for the provided registration number." });
    }

    if (pin && String(pin).trim() !== "" && candidate.pin && candidate.pin.trim() !== String(pin).trim()) {
      return res.status(401).json({ message: "Invalid PIN provided for candidate." });
    }

    const attemptRepo = AppDataSource.getRepository(Attempt);
    const identifiers = Array.from(new Set([
      candidate.examNumber?.trim().toLowerCase(),
      candidate.id?.trim().toLowerCase(),
      candidate.email?.trim().toLowerCase()
    ].filter(Boolean)));

    let attempt;
    if (attemptId) {
      attempt = await attemptRepo.createQueryBuilder("a")
        .where("a.id = :attemptId", { attemptId })
        .andWhere("LOWER(TRIM(a.userId)) IN (:...identifiers)", { identifiers })
        .getOne();
    } else {
      attempt = await attemptRepo.createQueryBuilder("a")
        .where("LOWER(TRIM(a.userId)) IN (:...identifiers)", { identifiers })
        .andWhere("a.status = :status", { status: 'completed' })
        .orderBy("a.completedAt", "DESC")
        .getOne();
    }

    if (!attempt) {
      return res.status(404).json({ message: "No completed exam attempt record found for this candidate." });
    }

    if (!attempt.isReleased) {
      return res.status(403).json({ message: "Result has not been released yet by administration." });
    }

    const { password: _, pin: __, ...safeCandidate } = candidate as any;
    return res.json({ candidate: safeCandidate, attempt });
  } catch (error: any) {
    logger.error("Check result error:", error);
    return res.status(500).json({ message: "Unable to retrieve examination result." });
  }
});

export default router;
