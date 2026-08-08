import { Router } from "express";
import { AppDataSource } from "../data-source";
import { Attempt } from "../entities/Attempt";
import { Exam } from "../entities/Exam";
import { Log } from "../entities/Log";
import { authenticateJWT, authorizeRoles } from "../middleware/auth";

const router = Router();

router.get("/logs", authenticateJWT, authorizeRoles("admin", "super_admin"), async (req, res) => {
  const logs = await AppDataSource.getRepository(Log).find({
    order: { timestamp: "DESC" },
    take: 100
  });
  res.json(logs);
});

router.get("/export-results", authenticateJWT, authorizeRoles("admin", "super_admin"), async (req, res) => {
  try {
    const attempts = await AppDataSource.getRepository(Attempt).find({
      where: { status: "completed" }
    });

    let csv = "Exam Number,Score,Total Possible,Date Completed\n";
    attempts.forEach((a: any) => {
      csv += `${a.userId},${a.score},${a.totalPossible},${a.completedAt?.toISOString()}\n`;
    });

    res.header('Content-Type', 'text/csv');
    res.attachment('cbt_results_export.csv');
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
      averageScore: parseFloat(avgScoreResult.avg || 0).toFixed(2),
      passRate: totalAttempts > 0 ? ((passCount / totalAttempts) * 100).toFixed(2) : 0,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error });
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

    res.json(performance);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
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

export default router;
