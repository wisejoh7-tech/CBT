import { sendVerificationEmail } from "./lib/services";
import { config } from "./lib/config";
import dotenv from "dotenv";

dotenv.config();

async function testVerificationEmail() {
  console.log("--- Testing sendVerificationEmail ---");
  const testEmail = config.mail?.user || "test@example.com";
  const testLink = "https://vivicbt.com/verify?token=123456";

  console.log(`Sending verification email to: ${testEmail}`);
  try {
    const success = await sendVerificationEmail(testEmail, testLink);
    if (success) {
      console.log("✅ sendVerificationEmail test passed!");
    } else {
      console.log("⚠️ sendVerificationEmail test finished (delivery skipped or simulated)");
    }
  } catch (error) {
    console.error("❌ sendVerificationEmail test failed:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  testVerificationEmail().then(() => process.exit(0));
}

export { testVerificationEmail };
