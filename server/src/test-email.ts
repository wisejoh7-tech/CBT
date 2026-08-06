import { transporter } from "./index";
import { config } from "./lib/config";
import dotenv from "dotenv";

dotenv.config();

async function testEmail() {
  console.log("--- Email Configuration ---");
  console.log("Host:", config.MAIL_HOST);
  console.log("Port:", config.MAIL_PORT);
  console.log("User:", config.MAIL_USER);
  console.log("Pass:", config.MAIL_PASS ? "****" : "MISSING");

  try {
    console.log("Verifying transporter...");
    await transporter.verify();
    console.log("✅ Transporter is ready to take messages");

    console.log("Sending test email...");
    const info = await transporter.sendMail({
      from: `"VIVI CBT Test" <${config.MAIL_USER}>`,
      to: config.MAIL_USER, // Send to self
      subject: "Test Email",
      text: "If you see this, your email configuration is working!",
    });
    console.log("✅ Message sent: %s", info.messageId);
  } catch (error: any) {
    console.error("❌ Email test failed:");
    console.error(error);
  }
  process.exit();
}

testEmail();
