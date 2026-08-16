import { Router } from "express";
import { AppDataSource } from "../data-source";
import { Subject } from "../entities/Subject";
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
    res.status(500).json({ message: "Failed to fetch subjects" });
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
