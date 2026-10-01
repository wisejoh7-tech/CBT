import { transporter, sendEmailSafely } from "./lib/services";
import { config } from "./lib/config";
import dotenv from "dotenv";

dotenv.config();

async function testEmail() {
  console.log("--- Email Configuration ---");
  console.log("Host:", config.mail.host);
  console.log("Port:", config.mail.port);
  console.log("User:", config.mail.user);
  console.log("Pass:", config.mail.pass ? "****" : "MISSING");

  try {
    console.log("Verifying transporter...");
    await transporter.verify();
    console.log("✅ Transporter is ready to take messages");

    console.log("Sending test email using sendEmailSafely...");
    const success = await sendEmailSafely({
      to: config.mail.user || "test@example.com",
      subject: "Test Email",
      text: "If you see this, your email configuration is working!",
    });

    if (success) {
      console.log("✅ Message sent successfully");
    } else {
      console.log("⚠️ Email dispatch was skipped or failed (check logs)");
    }
  } catch (error: any) {
    console.error("❌ Email test failed:");
    console.error(error);
  }
  process.exit();
}

testEmail();
