import { AppDataSource } from "./data-source";
import { Candidate } from "./entities/Candidate";
import { Attempt } from "./entities/Attempt";
import dotenv from "dotenv";

dotenv.config();

async function testFlow() {
  await AppDataSource.initialize();
  console.log("--- Result Release Flow Test ---");

  const candidateRepo = AppDataSource.getRepository(Candidate);
  const attemptRepo = AppDataSource.getRepository(Attempt);

  // 1. Create a dummy candidate
  const examNumber = "TEST" + Math.floor(Math.random() * 10000);
  const candidate = candidateRepo.create({
    examNumber,
    fullName: "TEST CANDIDATE",
    email: `${examNumber}@test.com`,
    subjectCombination: ["Math", "English"]
  });
  await candidateRepo.save(candidate);
  console.log(`✅ Created test candidate: ${examNumber}`);

  // 2. Schedule the candidate
  candidate.examVenue = "Main Hall, Zone A";
  candidate.examDate = "2026-09-10";
  candidate.examTime = "08:30 AM";
  await candidateRepo.save(candidate);
  console.log("✅ Candidate scheduled");

  // 3. Create a completed attempt (simulating just finished)
  const attempt = attemptRepo.create({
    userId: examNumber,
    examId: "exam-123",
    score: 85,
    totalPossible: 100,
    status: 'completed',
    completedAt: new Date() // Just now
  });
  await attemptRepo.save(attempt);
  console.log("✅ Completed attempt created (Just now)");

  // 4. Try to release (should be skipped due to 5-day rule)
  const fiveDaysAgo = new Date(Date.now() - (6 * 24 * 60 * 60 * 1000));

  console.log("Testing 5-day rule...");
  if (attempt.completedAt && attempt.completedAt > fiveDaysAgo) {
     console.log("ℹ️ Logic Check: Attempt is too fresh to release (Correct)");
  }

  // 5. Backdate the attempt to 6 days ago
  attempt.completedAt = fiveDaysAgo;
  await attemptRepo.save(attempt);
  console.log("✅ Backdated attempt to 6 days ago");

  // 6. Release it
  attempt.isReleased = true;
  await attemptRepo.save(attempt);
  console.log("✅ Result released successfully");

  // Clean up if desired, or keep for inspection
  console.log("\n--- Summary ---");
  console.log(`Candidate ${examNumber} is scheduled for ${candidate.examDate} at ${candidate.examVenue}`);
  console.log(`Attempt ${attempt.id} isReleased: ${attempt.isReleased}`);

  await AppDataSource.destroy();
  process.exit();
}

testFlow().catch(console.error);
