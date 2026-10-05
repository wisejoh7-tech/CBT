import { Router } from "express";
import { AppDataSource } from "../data-source";
import { Candidate } from "../entities/Candidate";
import { Attempt } from "../entities/Attempt";
import { Seat } from "../entities/Seat";
import { authenticateJWT, authorizeRoles } from "../middleware/auth";

const router = Router();

// --- ADMIN ROUTES ---

// Get all candidates (Admin only)
router.get("/", authenticateJWT, authorizeRoles("admin", "super_admin", "reg_admin"), async (req, res) => {
  try {
    const candidates = await AppDataSource.getRepository(Candidate).find({
      order: { createdAt: "DESC" }
    });
    res.json(candidates);
  } catch (error) {
    res.status(500).json({ message: "Unable to retrieve candidates" });
  }
});

// Update candidate (Admin only)
router.put("/:examNumber", authenticateJWT, authorizeRoles("admin", "super_admin", "reg_admin"), async (req, res) => {
  try {
    const examNumber = req.params.examNumber as string;
    const candidateRepo = AppDataSource.getRepository(Candidate);
    const candidate = await candidateRepo.findOneBy({ examNumber });

    if (!candidate) return res.status(404).json({ message: "Candidate not found" });

    // If email is being changed, check for uniqueness
    if (req.body.email && req.body.email !== candidate.email) {
      const existingEmail = await candidateRepo.findOneBy({ email: req.body.email });
      if (existingEmail) return res.status(400).json({ message: "Email already registered to another candidate" });
    }

    const updates = { ...req.body };

    // Convert empty strings to null for nullable date/time/phone fields to avoid Postgres type errors
    if (updates.examDate === "") updates.examDate = null;
    if (updates.examTime === "") updates.examTime = null;
    if (updates.dateOfBirth === "") updates.dateOfBirth = null;
    if (updates.phoneNumber === "") updates.phoneNumber = null;
    if (updates.assignedSeatNumber === "") updates.assignedSeatNumber = null;

    candidateRepo.merge(candidate, updates);
    await candidateRepo.save(candidate);

    res.json(candidate);
  } catch (error: any) {
    console.error("Candidate update error:", error);
    res.status(500).json({ message: "Update failed", error: error.message });
  }
});

// Delete candidate (Admin only)
router.delete("/:examNumber", authenticateJWT, authorizeRoles("admin", "super_admin", "reg_admin"), async (req, res) => {
  try {
    const examNumber = req.params.examNumber as string;
    const candidateRepo = AppDataSource.getRepository(Candidate);
    const candidate = await candidateRepo.findOneBy({ examNumber });
    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    // Unassign seat if candidate is assigned to a seat
    const seatRepo = AppDataSource.getRepository(Seat);
    await seatRepo.update({ assignedCandidateId: candidate.id }, { assignedCandidateId: null as any, status: "available" as any });

    // Remove any attempts for this candidate
    const attemptRepo = AppDataSource.getRepository(Attempt);
    await attemptRepo.delete({ userId: candidate.examNumber });

    await candidateRepo.remove(candidate);
    res.status(204).send();
  } catch (error: any) {
    console.error("Candidate deletion error:", error);
    res.status(500).json({ message: "Deletion failed", error: error.message });
  }
});

// Bulk Assign Scheduling (Admin only)
router.post("/bulk-assign", authenticateJWT, authorizeRoles("admin", "super_admin", "reg_admin"), async (req, res) => {
  const { examVenue, examDate, examTime, startSeatNumber, assignments } = req.body;

  try {
    const candidateRepo = AppDataSource.getRepository(Candidate);

    if (assignments && Array.isArray(assignments)) {
      // Individual assignments provided
      for (const entry of assignments) {
        const c = await candidateRepo.findOneBy({ id: entry.id });
        if (c) {
          if (entry.examNumber) c.examNumber = entry.examNumber;
          if (entry.examVenue) c.examVenue = entry.examVenue;
          if (entry.examDate) c.examDate = entry.examDate;
          if (entry.examTime) c.examTime = entry.examTime;
          if (entry.assignedSeatNumber) c.assignedSeatNumber = entry.assignedSeatNumber.toString();
          await candidateRepo.save(c);
        }
      }
      return res.json({ message: `Successfully updated ${assignments.length} candidate assignments` });
    }

    // Fallback to traditional bulk logic
    const candidates = await candidateRepo.find({ order: { createdAt: "ASC" } });
    let currentSeat = parseInt(startSeatNumber) || 1;

    for (const c of candidates) {
      if (examVenue) c.examVenue = examVenue;
      if (examDate) c.examDate = examDate;
      if (examTime) c.examTime = examTime;
      c.assignedSeatNumber = currentSeat.toString();
      currentSeat++;
    }

    await candidateRepo.save(candidates);
    res.json({ message: `Successfully assigned ${candidates.length} candidates` });
  } catch (error: any) {
    res.status(500).json({ message: "Bulk assignment failed", error: error.message });
  }
});

// Push Exam to All
router.post("/push-exam", authenticateJWT, authorizeRoles("admin", "super_admin"), async (req, res) => {
  const { examId } = req.body;
  if (!examId) return res.status(400).json({ message: "Exam ID required" });

  try {
    const candidateRepo = AppDataSource.getRepository(Candidate);
    await candidateRepo.createQueryBuilder()
      .update(Candidate)
      .set({ assignedExamId: examId })
      .execute();

    res.json({ message: "Exam module pushed to all candidates" });
  } catch (error: any) {
    res.status(500).json({ message: "Push failed", error: error.message });
  }
});

// --- CANDIDATE ROUTES ---
router.get("/dashboard", authenticateJWT, async (req: any, res) => {
  const examNumber = req.user.examNumber;
  if (!examNumber) return res.status(403).json({ message: "Only candidates can access this" });

  try {
    const candidate = await AppDataSource.getRepository(Candidate).findOneBy({ examNumber });
    if (!candidate) {
      return res.status(404).json({ message: "Candidate record not found" });
    }

    const attempts = await AppDataSource.getRepository(Attempt).find({
      where: { userId: examNumber, status: 'completed' },
      order: { completedAt: 'DESC' }
    });

    // Mask results that are not released yet
    const processedAttempts = attempts.map(attempt => {
      if (!attempt.isReleased) {
        return {
          id: attempt.id,
          examId: attempt.examId,
          status: attempt.status,
          completedAt: attempt.completedAt,
          isReleased: false,
          message: "Result pending release by admin"
        };
      }
      return attempt;
    });

    res.json({
      candidate: {
        examNumber: candidate?.examNumber,
        fullName: candidate?.fullName,
        email: candidate?.email,
        phoneNumber: candidate?.phoneNumber,
        stateOfOrigin: candidate?.stateOfOrigin,
        lga: candidate?.lga,
        schoolAttended: candidate?.schoolAttended,
        address: candidate?.address,
        examVenue: candidate?.examVenue,
        examDate: candidate?.examDate,
        examTime: candidate?.examTime,
        assignedExamId: candidate?.assignedExamId,
        subjectCombination: candidate?.subjectCombination,
        faceUrl: candidate?.faceUrl
      },
      attempts: processedAttempts
    });
  } catch (error) {
    res.status(500).json({ message: "Unable to retrieve dashboard data" });
  }
});

// Update Profile
router.put("/profile", authenticateJWT, async (req: any, res) => {
  const examNumber = req.user.examNumber;
  if (!examNumber) return res.status(403).json({ message: "Unauthorized" });

  const { fullName, phoneNumber, stateOfOrigin, lga, country, city, schoolAttended, address, dateOfBirth } = req.body;

  try {
    const candidateRepo = AppDataSource.getRepository(Candidate);
    const candidate = await candidateRepo.findOneBy({ examNumber });
    if (!candidate) return res.status(404).json({ message: "Candidate not found" });

    // Update fields
    if (fullName) candidate.fullName = fullName;
    if (phoneNumber) candidate.phoneNumber = phoneNumber;
    if (stateOfOrigin) candidate.stateOfOrigin = stateOfOrigin;
    if (lga) candidate.lga = lga;
    if (country) candidate.country = country;
    if (city) candidate.city = city;
    if (schoolAttended) candidate.schoolAttended = schoolAttended;
    if (address) candidate.address = address;
    if (dateOfBirth) candidate.dateOfBirth = dateOfBirth;

    await candidateRepo.save(candidate);

    res.json({ message: "Profile updated successfully", candidate });
  } catch (error: any) {
    res.status(500).json({ message: "Failed to update profile", error: error.message });
  }
});

// Endpoint for printable slips (JSON data that frontend can format)
router.get("/print/:type", authenticateJWT, async (req: any, res) => {
  const { type } = req.params; // 'schedule' or 'result'
  const examNumber = req.user.examNumber;
  if (!examNumber) return res.status(403).json({ message: "Unauthorized" });

  try {
    const candidate = await AppDataSource.getRepository(Candidate).findOneBy({ examNumber });
    if (!candidate) return res.status(404).json({ message: "Candidate not found" });

    if (type === 'schedule') {
      return res.json({
        title: "EXAMINATION SLIP",
        candidate: {
          fullName: candidate.fullName,
          examNumber: candidate.examNumber,
          email: candidate.email,
          phone: candidate.phoneNumber,
          subjects: candidate.subjectCombination
        },
        schedule: {
          venue: candidate.examVenue || "NOT ASSIGNED",
          date: candidate.examDate || "NOT ASSIGNED",
          time: candidate.examTime || "NOT ASSIGNED"
        },
        footer: "Please bring this slip to the examination center."
      });
    }

    if (type === 'result') {
      const { attemptId } = req.query;
      if (!attemptId) return res.status(400).json({ message: "Attempt ID required" });

      const attempt = await AppDataSource.getRepository(Attempt).findOneBy({
        id: attemptId as string,
        userId: examNumber
      });

      if (!attempt) return res.status(404).json({ message: "Result not found" });
      if (!attempt.isReleased) return res.status(403).json({ message: "Result not yet released" });

      return res.json({
        title: "EXAMINATION RESULT SLIP",
        candidate: {
          fullName: candidate.fullName,
          examNumber: candidate.examNumber
        },
        result: {
          score: attempt.score,
          total: attempt.totalPossible,
          percentage: ((attempt.score / attempt.totalPossible) * 100).toFixed(2) + "%",
          breakdown: attempt.results?.subjects || {}
        },
        datePrinted: new Date().toLocaleDateString()
      });
    }

    res.status(400).json({ message: "Invalid print type" });
  } catch (error) {
    res.status(500).json({ message: "Printing failed" });
  }
});

export default router;
