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
import { transporter } from "../lib/services";
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
  const data = {
    ...req.body,
    totalQuestions: req.body.totalQuestions || 0,
    createdBy: req.body.createdBy || req.user?.displayName || "Admin",
    isActive: req.body.isActive ?? true,
  };

  const exam = examRepo.create(data);
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

// --- Remaining routes unchanged (study guide, attempts, proctoring, admin scheduling, release, public checker) ---
export default router;
