import { Router } from "express";
import { AppDataSource } from "../data-source";
import { Candidate } from "../entities/Candidate";
import { Attempt } from "../entities/Attempt";
import { authenticateJWT } from "../middleware/auth";

const router = Router();

// Get Candidate's Own Dashboard Data (Schedule & Released Results)
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
        subjectCombination: candidate?.subjectCombination,
        faceUrl: candidate?.faceUrl
      },
      attempts: processedAttempts
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch dashboard data" });
  }
});

// Update Profile
router.put("/profile", authenticateJWT, async (req: any, res) => {
  const examNumber = req.user.examNumber;
  if (!examNumber) return res.status(403).json({ message: "Unauthorized" });

  const { fullName, phoneNumber, stateOfOrigin, lga, schoolAttended, address, dateOfBirth } = req.body;

  try {
    const candidateRepo = AppDataSource.getRepository(Candidate);
    const candidate = await candidateRepo.findOneBy({ examNumber });
    if (!candidate) return res.status(404).json({ message: "Candidate not found" });

    // Update fields
    if (fullName) candidate.fullName = fullName.toUpperCase();
    if (phoneNumber) candidate.phoneNumber = phoneNumber;
    if (stateOfOrigin) candidate.stateOfOrigin = stateOfOrigin;
    if (lga) candidate.lga = lga;
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
