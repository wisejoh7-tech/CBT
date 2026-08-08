import { Router } from "express";
import { AppDataSource } from "../data-source";
import { Subject } from "../entities/Subject";
import { authenticateJWT, authorizeRoles } from "../middleware/auth";

const router = Router();

// Get all offered subjects
router.get("/", async (req, res) => {
  const subjects = await AppDataSource.getRepository(Subject).find({
    order: { name: "ASC" }
  });
  res.json(subjects);
});

// Add a new subject (Admin only)
router.post("/", authenticateJWT, authorizeRoles("admin", "super_admin"), async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: "Subject name is required" });

  try {
    const subjectRepo = AppDataSource.getRepository(Subject);
    const existing = await subjectRepo.findOneBy({ name });
    if (existing) return res.status(400).json({ message: "Subject already exists" });

    const subject = subjectRepo.create({ name });
    await subjectRepo.save(subject);
    res.status(201).json(subject);
  } catch (error) {
    res.status(500).json({ message: "Failed to create subject" });
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
