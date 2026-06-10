import { Router } from "express";
import { AppDataSource } from "../data-source";
import { Exam } from "../entities/Exam";
import { Question } from "../entities/Question";
import { Attempt } from "../entities/Attempt";
import { Candidate } from "../entities/Candidate";
import { authenticateJWT, authorizeRoles } from "../middleware/auth";
import { analyzeProctoringSnapshot, generateBulkQuestionsFromSyllabus, generatePersonalizedStudyGuide, verifyCandidateIdentity } from "../lib/gemini";
import { createLog } from "../lib/logger";

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
      }).catch(err => console.error("Identity verification failed:", err));
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
  }).catch(err => console.error("Snapshot analysis error:", err));

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

    questions.forEach(q => {
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
  }

  await attemptRepo.save(attempt);
  res.json(attempt);
});

router.delete("/attempt/:attemptId", authenticateJWT, authorizeRoles("admin", "super_admin"), async (req, res) => {
  await AppDataSource.getRepository(Attempt).delete(req.params.attemptId as any);
  res.status(204).send();
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
