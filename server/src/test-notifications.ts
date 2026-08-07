import { transporter, redisClient } from "./lib/services";
import { sendSMS } from "./lib/sms";
import { config } from "./lib/config";
import { AppDataSource } from "./data-source";
import dotenv from "dotenv";

dotenv.config();

async function testNotifications() {
  console.log("--- Notification Test ---");

  // Initialize DB and connect Redis for full test
  try {
    await AppDataSource.initialize();
    await redisClient.connect();
  } catch (e) {
    console.error("Setup failed:", e);
  }

  const testEmail = process.env.MAIL_USER || "test@example.com";
  const testPhone = process.env.TWILIO_PHONE_NUMBER || "+1234567890"; // For testing, this should be a real number if credentials exist

  // 1. Test Email
  console.log(`Testing Email to: ${testEmail}`);
  try {
    await transporter.sendMail({
      from: `"Test Support" <${config.MAIL_USER}>`,
      to: testEmail,
      subject: "🔔 Test Notification",
      text: "This is a test email from the VIVI CBT system."
    });
    console.log("✅ Email sent successfully");
  } catch (error) {
    console.error("❌ Email failed:", error);
  }

  // 2. Test SMS
  console.log(`Testing SMS to: ${testPhone}`);
  try {
    await sendSMS(testPhone, "VIVI CBT: This is a test SMS message.");
    console.log("✅ SMS process initiated (check logs for success/failure)");
  } catch (error) {
    console.error("❌ SMS failed:", error);
  }

  process.exit();
}

testNotifications();
