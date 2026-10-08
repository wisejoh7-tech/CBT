import { Router } from "express";
import { AppDataSource } from "../data-source";
import { Subject } from "../entities/Subject";
import { Exam } from "../entities/Exam";
import { authenticateJWT, authorizeRoles } from "../middleware/auth";
import { logger } from "../lib/logger";

const router = Router();

// Get all offered subjects
router.get("/", async (req, res) => {
  try {
    const subjectRepo = AppDataSource.getRepository(Subject);
    let subjects = await subjectRepo.find({
      order: { name: "ASC" }
    });

    // Safety auto-seed: If database is somehow empty, populate core subjects
    if (subjects.length === 0) {
      const defaults = ["English Language", "Mathematics", "Physics", "Chemistry", "Biology", "Economics", "Government"];
      const seed = defaults.map(name => subjectRepo.create({ name, isActive: true }));
      await subjectRepo.save(seed);
      subjects = await subjectRepo.find({ order: { name: "ASC" } });
    }

    res.json(subjects);
  } catch (error: any) {
    logger.error("Fetch subjects critical error:", error.message);
    res.status(500).json({ message: "Unable to retrieve subjects" });
  }
});

// Add a new subject (Admin only)
router.post("/", authenticateJWT, authorizeRoles("admin", "super_admin"), async (req, res) => {
  const { name } = req.body;
  logger.debug(`Adding subject attempt: ${name}`);

  if (!name) return res.status(400).json({ message: "Subject name is required" });

  try {
    const subjectRepo = AppDataSource.getRepository(Subject);
    // Case-insensitive search for existing subject
    const existing = await subjectRepo.createQueryBuilder("subject")
      .where("LOWER(subject.name) = LOWER(:name)", { name: name.trim() })
      .getOne();

    if (existing) return res.status(400).json({ message: "Subject already exists" });

    const subject = subjectRepo.create({ name: name.trim(), isActive: true });
    await subjectRepo.save(subject);
    logger.info(`Subject added: ${name}`);
    res.status(201).json(subject);
  } catch (error: any) {
    logger.error("Failed to create subject:", error.message);
    res.status(500).json({ message: "Failed to create subject", error: error.message });
  }
});

// Release all subjects to Exam Player (Admin only)
router.post("/release-all", authenticateJWT, authorizeRoles("admin", "super_admin", "reg_admin"), async (req: any, res) => {
  try {
    const subjectRepo = AppDataSource.getRepository(Subject);
    const examRepo = AppDataSource.getRepository(Exam);

    // 1. Set all subjects to active
    let subjects = await subjectRepo.find();
    if (subjects.length === 0) {
      const defaults = ["English Language", "Mathematics", "Physics", "Chemistry", "Biology", "Economics", "Government"];
      const seed = defaults.map(name => subjectRepo.create({ name, isActive: true }));
      await subjectRepo.save(seed);
      subjects = await subjectRepo.find();
    } else {
      for (const s of subjects) {
        if (!s.isActive) {
          s.isActive = true;
          await subjectRepo.save(s);
        }
      }
    }

    // 2. Set all existing exams to active
    const existingExams = await examRepo.find();
    for (const exam of existingExams) {
      if (!exam.isActive) {
        exam.isActive = true;
        await examRepo.save(exam);
      }
    }

    // 3. For any active subject without an exam module, auto-create one
    const creatorId = req.user?.id || "00000000-0000-0000-0000-000000000000";
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(creatorId);
    const validCreator = isUuid ? creatorId : "00000000-0000-0000-0000-000000000000";

    for (const s of subjects) {
      const hasExam = existingExams.some(e => {
        if (!e.subject) return false;
        const s1 = s.name.trim().toLowerCase();
        const s2 = e.subject.trim().toLowerCase();
        return s1 === s2 || s1.includes(s2) || s2.includes(s1);
      });

      if (!hasExam) {
        const newExam = examRepo.create({
          title: `${s.name} Module`,
          subject: s.name,
          durationMinutes: 30,
          totalQuestions: 0,
          createdBy: validCreator,
          isActive: true
        });
        await examRepo.save(newExam);
      }
    }

    res.json({ message: "All subjects released to exam player successfully" });
  } catch (error: any) {
    logger.error("Failed to release all subjects:", error.message);
    res.status(500).json({ message: "Failed to release subjects", error: error.message });
  }
});

// Toggle subject status
router.put("/:id", authenticateJWT, authorizeRoles("admin", "super_admin"), async (req, res) => {
  const subjectRepo = AppDataSource.getRepository(Subject);
  const subject = await subjectRepo.findOneBy({ id: req.params.id as any });
  if (!subject) return res.status(404).json({ message: "Subject not found" });

  subject.isActive = req.body.isActive ?? !subject.isActive;
  await subjectRepo.save(subject);
  res.json(subject);
});

// Delete a subject
router.delete("/:id", authenticateJWT, authorizeRoles("admin", "super_admin"), async (req, res) => {
  await AppDataSource.getRepository(Subject).delete(req.params.id as any);
  res.status(204).send();
});

export default router;
