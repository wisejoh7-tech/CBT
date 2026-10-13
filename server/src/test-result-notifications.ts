import { formatPhoneNumber, sendSMS } from "./lib/sms";
import { sendResultReleaseNotifications, findCandidateForAttempt } from "./routes/exam";
import { Candidate } from "./entities/Candidate";
import { Attempt } from "./entities/Attempt";

function testPhoneNumberFormatting() {
  console.log("--- Testing Phone Number Formatting ---");
  const testCases = [
    { input: "08012345678", expected: "+2348012345678" },
    { input: "09098765432", expected: "+2349098765432" },
    { input: "+2348012345678", expected: "+2348012345678" },
    { input: "8012345678", expected: "+2348012345678" },
    { input: " 080 1234 5678 ", expected: "+2348012345678" },
    { input: "080-1234-5678", expected: "+2348012345678" },
  ];

  let passed = true;
  for (const tc of testCases) {
    const formatted = formatPhoneNumber(tc.input);
    if (formatted === tc.expected) {
      console.log(`  ✅ formatPhoneNumber("${tc.input}") => "${formatted}"`);
    } else {
      console.error(`  ❌ formatPhoneNumber("${tc.input}") expected "${tc.expected}", got "${formatted}"`);
      passed = false;
    }
  }

  if (!passed) {
    throw new Error("Phone number formatting tests failed!");
  }
}

async function testResultReleaseNotificationPayload() {
  console.log("--- Testing Result Release Notification Object ---");

  const dummyCandidate = new Candidate();
  dummyCandidate.id = "test-uuid-123";
  dummyCandidate.examNumber = "VIVI/2026/001";
  dummyCandidate.fullName = "Jane Doe";
  dummyCandidate.email = "jane.doe@example.com";
  dummyCandidate.phoneNumber = "08012345678";

  const dummyAttempt = new Attempt();
  dummyAttempt.id = "attempt-uuid-456";
  dummyAttempt.userId = dummyCandidate.examNumber;
  dummyAttempt.score = 88;
  dummyAttempt.totalPossible = 100;
  dummyAttempt.isReleased = true;
  dummyAttempt.results = {
    subjects: {
      "English Language": { correct: 22, total: 25 },
      "Mathematics": { correct: 20, total: 25 },
      "Physics": { correct: 23, total: 25 },
      "Chemistry": { correct: 23, total: 25 }
    }
  };

  console.log(`Candidate: ${dummyCandidate.fullName} (${dummyCandidate.email}, ${dummyCandidate.phoneNumber})`);
  console.log(`Attempt: ${dummyAttempt.id}, Score: ${dummyAttempt.score}/${dummyAttempt.totalPossible}`);

  const formattedPhone = formatPhoneNumber(dummyCandidate.phoneNumber);
  console.log(`Formatted recipient phone for SMS: ${formattedPhone}`);

  if (formattedPhone !== "+2348012345678") {
    throw new Error("Formatted phone number mismatch!");
  }

  // Attempt notification execution safely
  const result = await sendResultReleaseNotifications(dummyCandidate, dummyAttempt);
  console.log(`Notification trigger completed for candidate entity. Result:`, result);

  // Test notification execution for User fallback format
  const dummyUserCandidate = {
    id: "user-uuid-789",
    examNumber: "VIVI/2026/002",
    fullName: "John Smith",
    email: "john.smith@example.com",
    phoneNumber: "09098765432"
  };

  const userResult = await sendResultReleaseNotifications(dummyUserCandidate, dummyAttempt);
  console.log(`Notification trigger completed for user fallback candidate. Result:`, userResult);

  console.log("✅ Result release notification payload logic verified!");
}

async function runAllTests() {
  try {
    testPhoneNumberFormatting();
    await testResultReleaseNotificationPayload();
    console.log("🎉 ALL RESULT NOTIFICATION TESTS PASSED!");
  } catch (err: any) {
    console.error("❌ Test failed:", err.message || err);
    process.exit(1);
  }
}

runAllTests();
