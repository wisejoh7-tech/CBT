import { Router } from "express";
import { AppDataSource } from "../data-source";
import { Exam } from "../entities/Exam";
import { Question } from "../entities/Question";
import { Attempt } from "../entities/Attempt";
import { Candidate } from "../entities/Candidate";
import { authenticateJWT, authorizeRoles } from "../middleware/auth";
import { analyzeProctoringSnapshot, generateBulkQuestionsFromSyllabus, generatePersonalizedStudyGuide, verifyCandidateIdentity } from "../lib/gemini";
import { createLog, logger } from "../lib/logger";
import { transporter, redisClient } from "../lib/services";
import { sendSMS } from "../lib/sms";
import { config } from "../lib/config";

const router = Router();

// --- EXAM ROUTES ---

router.get("/", authenticateJWT, async (req, res) => {
  const exams = await AppDataSource.getRepository(Exam).find({
    order: { createdAt: "DESC" }
  });
  res.json(exams);
});

router.post("/", authenticateJWT, authorizeRoles("admin", "super_admin"), async (req, res) => {
  const examRepo = AppDataSource.getRepository(Exam);
  const exam = examRepo.create(req.body);
  await examRepo.save(exam);
  res.status(201).json(exam);
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

  // Update totalQuestions in Exam
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

  const entities = questionRepo.create(questionsData.map((q: any) => ({ ...q, exam })));
  await questionRepo.save(entities);

  // Update totalQuestions in Exam
  const total = await questionRepo.count({ where: { exam: { id: exam.id } } });
  await AppDataSource.getRepository(Exam).update(exam.id, { totalQuestions: total });

  res.status(201).json({ message: `Successfully added ${entities.length} questions`, questions: entities });
});


router.put("/questions/:qid", authenticateJWT, authorizeRoles("admin", "super_admin"), async (req, res) => {
  const questionRepo = AppDataSource.getRepository(Question);
  const question = await questionRepo.findOneBy({ id: req.params.qid as any });
  if (!question) return res.status(404).json({ message: "Question not found" });
  questionRepo.merge(question, req.body);
  await questionRepo.save(question);
  res.json(question);
});

router.delete("/questions/:qid", authenticateJWT, authorizeRoles("admin", "super_admin"), async (req, res) => {
  const questionRepo = AppDataSource.getRepository(Question);
  const question = await questionRepo.findOne({ where: { id: req.params.qid as any }, relations: ["exam"] });
  if (!question) return res.status(404).json({ message: "Question not found" });

  const examId = question.exam.id;
  await questionRepo.remove(question);

  // Update totalQuestions
  const total = await questionRepo.count({ where: { exam: { id: examId } } });
  await AppDataSource.getRepository(Exam).update(examId, { totalQuestions: total });

  res.status(204).send();
});

// AI: Bulk Generate Questions
router.post("/:id/ai-generate", authenticateJWT, authorizeRoles("admin", "super_admin"), async (req, res) => {
  const { syllabus, count } = req.body;
  const exam = await AppDataSource.getRepository(Exam).findOneBy({ id: req.params.id as any });
  if (!exam) return res.status(404).json({ message: "Exam not found" });

  const aiQuestions = await generateBulkQuestionsFromSyllabus(syllabus, count || 10);

  if (!aiQuestions) return res.status(500).json({ error: "AI Generation failed" });

  const questionRepo = AppDataSource.getRepository(Question);
  const entities = aiQuestions.map((q: any) => questionRepo.create({ ...q, exam }));
  await questionRepo.save(entities);

  // Update totalQuestions
  const total = await questionRepo.count({ where: { exam: { id: exam.id } } });
  await AppDataSource.getRepository(Exam).update(exam.id, { totalQuestions: total });

  res.status(201).json({ message: `Successfully generated ${entities.length} questions`, questions: entities });
});

// AI: Generate Personalized Study Guide
router.get("/attempt/:attemptId/study-guide", authenticateJWT, async (req, res) => {
  const attempt = await AppDataSource.getRepository(Attempt).findOneBy({ id: req.params.attemptId as any });
  if (!attempt || !attempt.results) return res.status(404).json({ message: "Results not found" });

  const guide = await generatePersonalizedStudyGuide(attempt.results);

  if (!guide) return res.status(500).json({ error: "Failed to generate guide" });
  res.json(guide);
});

// --- ATTEMPT ROUTES ---

router.get("/attempts/all", authenticateJWT, authorizeRoles("admin", "super_admin"), async (req, res) => {
  const attempts = await AppDataSource.getRepository(Attempt).find();
  res.json(attempts);
});

router.post("/:id/attempt", authenticateJWT, async (req: any, res) => {
  const examId = req.params.id;
  const userId = req.user.id;
  const attemptRepo = AppDataSource.getRepository(Attempt);

  let attempt = await attemptRepo.findOneBy({ examId, userId, status: "in-progress" });

  if (!attempt) {
    const exam = await AppDataSource.getRepository(Exam).findOneBy({ id: examId });
    attempt = attemptRepo.create({
      userId,
      examId,
      totalPossible: exam?.totalQuestions || 0,
      status: "in-progress",
    });
    await attemptRepo.save(attempt);
  }

  res.json(attempt);
});

// Proctoring: Save snapshots
router.post("/attempt/:attemptId/snapshots", authenticateJWT, async (req, res) => {
  const attemptRepo = AppDataSource.getRepository(Attempt);
  const attempt = await attemptRepo.findOneBy({ id: req.params.attemptId as any });

  if (!attempt) return res.status(404).json({ message: "Attempt not found" });

  const { snapshot } = req.body;
  const snaps = (attempt as any).proctoringSnaps || [];
  (attempt as any).proctoringSnaps = [...snaps, snapshot].slice(-10); // Keep last 10

  // Run Identity Verification on first snapshot
  if (snaps.length === 0 && !attempt.isIdentityVerified) {
    const candidate = await AppDataSource.getRepository(Candidate).findOneBy({ examNumber: attempt.userId });
    if (candidate && candidate.faceUrl) {
      verifyCandidateIdentity(snapshot, candidate.faceUrl).then(async (result) => {
        if (result && result.match) {
          attempt.isIdentityVerified = true;
          await attemptRepo.save(attempt);

          await createLog({
            type: 'security',
            severity: 'info',
            message: `Identity verified for ${attempt.userId} (Confidence: ${result.confidence}%)`,
            userId: attempt.userId,
            metadata: { attemptId: attempt.id, confidence: result.confidence }
          });
        } else {
          attempt.trustScore = Math.max(0, attempt.trustScore - 20);
          await createLog({
            type: 'security',
            severity: 'critical',
            message: `IDENTITY MISMATCH detected for ${attempt.userId}`,
            userId: attempt.userId,
            metadata: { attemptId: attempt.id, result }
          });
        }
      }).catch(err => logger.error("Identity verification failed:", err));
    }
  }

  // Run AI analysis in background
  analyzeProctoringSnapshot(snapshot).then(async (analysis) => {
    if (analysis && analysis.suspicious) {
      attempt.trustScore = Math.max(0, attempt.trustScore + (analysis.trustScoreAdjustment || -5));
      attempt.violationLogs = [...(attempt.violationLogs || []), {
        timestamp: new Date(),
        reason: analysis.reason,
        snapshotIdx: (attempt as any).proctoringSnaps.length - 1
      }];
      await attemptRepo.save(attempt);

      await createLog({
        type: 'security',
        severity: 'warning',
        message: `Security alert for ${attempt.userId}: ${analysis.reason}`,
        userId: attempt.userId,
        metadata: { attemptId: attempt.id, trustScore: attempt.trustScore, reason: analysis.reason }
      });

      // Emit real-time update to admin
      const io = (req.app as any).get("io");
      if (io) {
        io.emit("security-alert", {
          attemptId: attempt.id,
          userId: attempt.userId,
          trustScore: attempt.trustScore,
          reason: analysis.reason
        });
      }
    }
  }).catch(err => logger.error("Snapshot analysis error:", err));

  await attemptRepo.save(attempt);
  res.status(204).send();
});

router.put("/attempt/:attemptId", authenticateJWT, async (req, res) => {
  const attemptRepo = AppDataSource.getRepository(Attempt);
  const attempt = await attemptRepo.findOneBy({ id: req.params.attemptId as any });

  if (!attempt) return res.status(404).json({ message: "Attempt not found" });

  const wasInProgress = attempt.status === "in-progress";
  attemptRepo.merge(attempt, req.body);

  if (wasInProgress && attempt.status === "completed") {
    // Calculate detailed topic-level and subject-level results
    const answers = attempt.answers || {};
    const questionRepo = AppDataSource.getRepository(Question);

    const questionIds = Object.keys(answers);
    const questions = await questionRepo.find({
      where: questionIds.map(id => ({ id })),
      relations: ["exam"]
    });

    const topicStats: Record<string, { correct: number, total: number }> = {};
    const subjectStats: Record<string, { correct: number, total: number }> = {};

    questions.forEach((q: any) => {
      const isCorrect = answers[q.id] === q.correctOptionIndex;
      const topic = q.topic || "General";
      const subject = q.exam.subject;

      if (!topicStats[topic]) topicStats[topic] = { correct: 0, total: 0 };
      topicStats[topic].total++;
      if (isCorrect) topicStats[topic].correct++;

      if (!subjectStats[subject]) subjectStats[subject] = { correct: 0, total: 0 };
      subjectStats[subject].total++;
      if (isCorrect) subjectStats[subject].correct++;
    });

    attempt.results = {
      topics: topicStats,
      subjects: subjectStats
    };
    attempt.completedAt = new Date();

    await createLog({
      type: 'exam',
      severity: 'info',
      message: `Exam attempt completed by ${attempt.userId}`,
      userId: attempt.userId,
      metadata: { attemptId: attempt.id, score: attempt.score, totalPossible: attempt.totalPossible }
    });

    // Send Result Notifications
    const candidate = await AppDataSource.getRepository(Candidate).findOneBy({ examNumber: attempt.userId });
    if (candidate) {
      const scorePercentage = ((attempt.score / attempt.totalPossible) * 100).toFixed(1);
      const downloadLink = `${req.protocol}://${req.get('host')}/auth/public/download-result/${attempt.id}`;

      // 1. Send Email Notification
      try {
        await transporter.sendMail({
          from: `"VIVI CBT Results" <${config.MAIL_USER}>`,
          to: candidate.email,
          subject: `📊 Your Exam Results are Ready - ${candidate.fullName}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
              <h2 style="color: #333;">Exam Performance Report</h2>
              <p>Hello <b>${candidate.fullName}</b>,</p>
              <p>Your examination results have been processed successfully.</p>

              <div style="background: #f4f4f4; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p style="margin: 5px 0;"><b>Score:</b> ${attempt.score} / ${attempt.totalPossible}</p>
                <p style="margin: 5px 0;"><b>Percentage:</b> ${scorePercentage}%</p>
                <p style="margin: 5px 0;"><b>Status:</b> ${attempt.score >= (attempt.totalPossible / 2) ? 'PASSED' : 'FAILED'}</p>
              </div>

              <h3>Subject Breakdown:</h3>
              <ul>
                ${Object.entries(attempt.results.subjects).map(([subject, stats]: [string, any]) =>
                  `<li><b>${subject}:</b> ${stats.correct} / ${stats.total}</li>`
                ).join('')}
              </ul>

              <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                <a href="${downloadLink}" style="display: inline-block; background-color: #0EA5E9; color: white; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: bold;">Download Official Result Slip</a>
              </div>

              <p style="color: #666; font-size: 12px; margin-top: 30px;">This is an automated message. Please do not reply.</p>
            </div>
          `
        });
      } catch (err) {
        logger.error("Failed to send result email", err);
      }

      // 2. Send SMS Notification
      if (candidate.phoneNumber) {
        const smsMessage = `VIVI CBT: Hello ${candidate.fullName}, your exam result is ready. Score: ${attempt.score}/${attempt.totalPossible} (${scorePercentage}%). Log in to the portal for details.`;
        await sendSMS(candidate.phoneNumber, smsMessage);
      }
    }
  }

  await attemptRepo.save(attempt);
  res.json(attempt);
});

router.delete("/attempt/:attemptId", authenticateJWT, authorizeRoles("admin", "super_admin"), async (req, res) => {
  await AppDataSource.getRepository(Attempt).delete(req.params.attemptId as any);
  res.status(204).send();
});

// --- ADMIN SCHEDULING & RELEASE ---

// Bulk Schedule Candidates
router.post("/admin/schedule-bulk", authenticateJWT, authorizeRoles("admin", "super_admin"), async (req, res) => {
  const { examNumbers, examVenue, examDate, examTime } = req.body;
  if (!Array.isArray(examNumbers)) return res.status(400).json({ message: "examNumbers must be an array" });

  const candidateRepo = AppDataSource.getRepository(Candidate);
  try {
    await candidateRepo.createQueryBuilder()
      .update(Candidate)
      .set({ examVenue, examDate, examTime })
      .where("examNumber IN (:...examNumbers)", { examNumbers })
      .execute();

    res.json({ message: `Schedule updated for ${examNumbers.length} candidates` });
  } catch (error) {
    res.status(500).json({ message: "Failed to update schedules", error });
  }
});

// Release Results (with 5-day check)
router.post("/admin/release-results", authenticateJWT, authorizeRoles("admin", "super_admin"), async (req, res) => {
  const { attemptIds } = req.body; // Array of attempt IDs
  if (!Array.isArray(attemptIds)) return res.status(400).json({ message: "attemptIds must be an array" });

  const attemptRepo = AppDataSource.getRepository(Attempt);
  const now = new Date();
  const fiveDaysAgo = new Date(now.getTime() - (5 * 24 * 60 * 60 * 1000));

  try {
    const attempts = await attemptRepo.find({
      where: attemptIds.map(id => ({ id }))
    });

    const toRelease: string[] = [];
    const tooEarly: string[] = [];

    attempts.forEach(attempt => {
      if (attempt.status !== 'completed') return;

      const completedAt = attempt.completedAt ? new Date(attempt.completedAt) : null;
      if (completedAt && completedAt <= fiveDaysAgo) {
        toRelease.push(attempt.id);
      } else {
        tooEarly.push(attempt.id);
      }
    });

    if (toRelease.length > 0) {
      await attemptRepo.createQueryBuilder()
        .update(Attempt)
        .set({ isReleased: true })
        .where("id IN (:...ids)", { ids: toRelease })
        .execute();
    }

    res.json({
      message: `Released ${toRelease.length} results. ${tooEarly.length} results were skipped (less than 5 days since completion).`,
      released: toRelease,
      skipped: tooEarly
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to release results", error });
  }
});

// --- PUBLIC RESULT CHECKER ---
router.post("/public/check-result", async (req, res) => {
  const { examNumber, pin } = req.body;

  const candidateData = await AppDataSource.getRepository(Candidate).findOneBy({ examNumber });
  if (!candidateData) return res.status(404).json({ message: "Record not found" });

  const attempt = await AppDataSource.getRepository(Attempt).findOneBy({
    userId: examNumber,
    examId: 'unified',
    status: 'completed'
  });

  if (!attempt) return res.status(404).json({ message: "Transcript not ready" });

  res.json({ attempt, candidate: candidateData });
});

export default router;
