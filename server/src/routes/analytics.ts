import { Router } from "express";
import { AppDataSource } from "../data-source";
import { Attempt } from "../entities/Attempt";
import { Exam } from "../entities/Exam";
import { Log } from "../entities/Log";
import { Candidate } from "../entities/Candidate";
import { authenticateJWT, authorizeRoles } from "../middleware/auth";

const router = Router();

router.get("/logs", authenticateJWT, authorizeRoles("admin", "super_admin"), async (req, res) => {
  const logs = await AppDataSource.getRepository(Log).find({
    order: { timestamp: "DESC" },
    take: 100
  });
  res.json(logs);
});

router.delete("/logs", authenticateJWT, authorizeRoles("super_admin"), async (req, res) => {
  try {
    await AppDataSource.getRepository(Log).delete({});
    res.json({ message: "All logs cleared successfully" });
  } catch (error: any) {
    res.status(500).json({ message: "Failed to clear logs", error: error.message });
  }
});

router.delete("/logs/:id", authenticateJWT, authorizeRoles("super_admin"), async (req, res) => {
  try {
    const logRepo = AppDataSource.getRepository(Log);
    const result = await logRepo.delete(req.params.id);

    if (result.affected === 0) {
      return res.status(404).json({ message: "Log not found" });
    }

    res.json({ message: "Log entry deleted successfully" });
  } catch (error: any) {
    console.error("Audit delete error:", error);
    res.status(500).json({ message: "Failed to delete log", error: error.message });
  }
});

router.get("/export-results", authenticateJWT, authorizeRoles("admin", "super_admin"), async (req, res) => {
  try {
    const attempts = await AppDataSource.getRepository(Attempt).find({
      where: { status: "completed" },
      order: { completedAt: "DESC" }
    });
    const candidates = await AppDataSource.getRepository(Candidate).find();
    const exams = await AppDataSource.getRepository(Exam).find();

    const headers = [
      "Exam Number",
      "Full Name",
      "Email",
      "Phone Number",
      "Exam Title",
      "Score",
      "Total Possible",
      "Percentage",
      "Release Status",
      "Trust Score",
      "Started At",
      "Completed At"
    ];

    const escapeCsv = (val: any) => `"${String(val ?? "").replace(/"/g, '""')}"`;

    let csv = "\uFEFF" + headers.map(escapeCsv).join(",") + "\n";

    attempts.forEach((a: any) => {
      const candidate = candidates.find(c => c.examNumber === a.userId || c.id === a.userId);
      const exam = exams.find(e => e.id === a.examId);
      const examTitle = exam ? `${exam.title} (${exam.subject})` : (a.examId === 'unified' ? 'Unified Standard Exam' : a.examId || 'General Assessment');
      const isReleased = Boolean(a.isReleased || a.released);
      const percentage = a.totalPossible > 0 ? `${((a.score / a.totalPossible) * 100).toFixed(2)}%` : '0%';

      const row = [
        candidate?.examNumber || a.userId,
        candidate?.fullName || "N/A",
        candidate?.email || "N/A",
        candidate?.phoneNumber || "N/A",
        examTitle,
        a.score,
        a.totalPossible,
        percentage,
        isReleased ? "PUBLISHED" : "PENDING",
        a.trustScore != null ? `${Math.round(a.trustScore)}%` : "100%",
        a.startedAt ? new Date(a.startedAt).toLocaleString() : "N/A",
        a.completedAt ? new Date(a.completedAt).toLocaleString() : "N/A"
      ];

      csv += row.map(escapeCsv).join(",") + "\n";
    });

    res.header('Content-Type', 'text/csv; charset=utf-8');
    res.attachment(`cbt_results_export_${new Date().toISOString().slice(0, 10)}.csv`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ message: "Export failed" });
  }
});

router.get("/summary", authenticateJWT, authorizeRoles("admin", "super_admin"), async (req, res) => {
  try {
    const attemptRepo = AppDataSource.getRepository(Attempt);
    const examRepo = AppDataSource.getRepository(Exam);

    const totalExams = await examRepo.count();
    const totalAttempts = await attemptRepo.count({ where: { status: "completed" } });

    // Average score across all completed attempts
    const avgScoreResult = await attemptRepo
      .createQueryBuilder("attempt")
      .select("AVG(attempt.score)", "avg")
      .where("attempt.status = :status", { status: "completed" })
      .getRawOne();

    // Pass rate (score >= 50% of totalPossible)
    const passCount = await attemptRepo
      .createQueryBuilder("attempt")
      .where("attempt.status = :status", { status: "completed" })
      .andWhere("attempt.score >= attempt.totalPossible / 2")
      .getCount();

    res.json({
      totalExams,
      totalAttempts,
      averageScore: parseFloat(avgScoreResult?.avg || 0).toFixed(2),
      passRate: totalAttempts > 0 ? ((passCount / totalAttempts) * 100).toFixed(2) : 0,
    });
  } catch (error: any) {
    console.error("Analytics summary error:", error);
    res.status(500).json({ message: error.message || "Failed to load analytics summary.", error: error.message || "Unknown error" });
  }
});

router.get("/exam-performance", authenticateJWT, authorizeRoles("admin", "super_admin"), async (req, res) => {
  try {
    const performance = await AppDataSource.getRepository(Attempt)
      .createQueryBuilder("attempt")
      .select("attempt.examId", "examId")
      .addSelect("AVG(attempt.score)", "averageScore")
      .addSelect("COUNT(attempt.id)", "count")
      .where("attempt.status = :status", { status: "completed" })
      .groupBy("attempt.examId")
      .getRawMany();

    res.json(performance || []);
  } catch (error: any) {
    console.error("Exam performance query error:", error);
    res.status(500).json({ message: "Internal server error", error: error.message || "Unknown error" });
  }
});

// Reset all performance metrics (deletes all attempts)
router.post("/reset", authenticateJWT, authorizeRoles("super_admin"), async (req, res) => {
  try {
    await AppDataSource.getRepository(Attempt).clear();
    res.json({ message: "Performance metrics reset successfully (All attempt data cleared)." });
  } catch (error) {
    res.status(500).json({ message: "Failed to reset metrics" });
  }
});

router.get("/detailed-performance", authenticateJWT, authorizeRoles("admin", "super_admin"), async (req, res) => {
  try {
    const attemptRepo = AppDataSource.getRepository(Attempt);
    const candidateRepo = AppDataSource.getRepository(Candidate);

    // Get all completed attempts with candidate info
    const attempts = await attemptRepo.find({
      where: { status: "completed" },
      order: { completedAt: "DESC" }
    });

    const candidates = await candidateRepo.find();

    // Performance by Candidate
    const candidatePerformance = attempts.map(a => {
      const candidate = candidates.find(c => c.examNumber === a.userId);
      return {
        examNumber: a.userId,
        fullName: candidate?.fullName || "Unknown",
        score: a.score,
        totalPossible: a.totalPossible,
        percentage: ((a.score / a.totalPossible) * 100).toFixed(2),
        date: a.completedAt
      };
    });

    // Performance by Topic (Aggregate)
    const topicPerformance: Record<string, { correct: number, total: number }> = {};
    attempts.forEach(a => {
      if (a.results?.topics) {
        Object.entries(a.results.topics).forEach(([topic, stats]: [string, any]) => {
          if (!topicPerformance[topic]) topicPerformance[topic] = { correct: 0, total: 0 };
          topicPerformance[topic].correct += stats.correct;
          topicPerformance[topic].total += stats.total;
        });
      }
    });

    res.json({
      candidates: candidatePerformance,
      topics: Object.entries(topicPerformance).map(([name, stats]) => ({
        name,
        avgScore: ((stats.correct / stats.total) * 100).toFixed(2),
        totalAttempts: stats.total
      }))
    });
  } catch (error) {
    res.status(500).json({ message: "Unable to retrieve detailed analytics" });
  }
});

export default router;
