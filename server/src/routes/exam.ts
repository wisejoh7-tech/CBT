import { Router } from "express";
import { AppDataSource } from "../data-source";
import { Exam } from "../entities/Exam";
import { Question } from "../entities/Question";
import { Attempt } from "../entities/Attempt";
import { Candidate } from "../entities/Candidate";
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
    relations: ["questions"],
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
  const attempts = await AppDataSource.getRepository(Attempt).find({
    order: { startedAt: "DESC" },
    take: 500 // Limit for performance
  });
  res.json(attempts);
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

    // Fetch candidate for notifications
    const candidate = await candidateRepo.findOneBy({ examNumber: attempt.userId });

    if (candidate) {
      const scoreMsg = `VIVI CBT: Hello ${candidate.fullName}, your exam results have been released. Score: ${attempt.score}/${attempt.totalPossible}. Visit the portal to print your slip.`;

      // Send Email
      if (candidate.email) {
        try {
          await sendEmailSafely({
            to: candidate.email,
            subject: "OFFICIAL EXAM RESULT RELEASED",
            html: `
              <div style="font-family: sans-serif; padding: 20px; color: #333;">
                <h2 style="color: #0EA5E9;">Result Notification</h2>
                <p>Hello <b>${candidate.fullName}</b>,</p>
                <p>Your performance record for the VIVI Standard Examination has been verified and released.</p>
                <div style="background: #f8fafc; padding: 20px; border-radius: 12px; margin: 20px 0;">
                  <p style="margin: 0; font-size: 14px; color: #64748b;">AGGREGATE SCORE</p>
                  <p style="margin: 5px 0 0 0; font-size: 32px; font-weight: 900; color: #0EA5E9;">${attempt.score} / ${attempt.totalPossible}</p>
                </div>
                <p>You can now log in to your candidate dashboard to view the full breakdown and print your official result slip.</p>
                <p style="font-size: 12px; color: #94a3b8; margin-top: 40px;">&copy; 2026 VIVI CBT Systems. This is an automated security notification.</p>
              </div>
            `
          });
        } catch (emailErr) {
          logger.error("Failed to send result email:", emailErr);
        }
      }

      // Send SMS
      if (candidate.phoneNumber) {
        await sendSMS(candidate.phoneNumber, scoreMsg);
      }
    }

    res.json({ message: "Results released and notifications dispatched." });
  } catch (error: any) {
    res.status(500).json({ message: "Failed to release results", error: error.message });
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
      if (!candidate) return res.status(404).json({ message: "Candidate profile not found" });

      const subjectNames = candidate.subjectCombination || [];

      // Fetch questions from all exams matching subjects
      questions = await questionRepo.find({
        where: subjectNames.map(s => ({ exam: { subject: s } })),
        relations: ["exam"]
      });
    } else {
      // Specific exam marking
      questions = await questionRepo.find({
        where: { exam: { id: attempt.examId } },
        relations: ["exam"]
      });
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

export default router;
