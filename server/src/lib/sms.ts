import { logger } from "./logger";
import { config } from "./config";

// Note: You would typically use a package like 'twilio'
// npm install twilio
// For now, we'll implement a stub that logs to console if credentials are missing
// or uses a generic approach.

export async function sendSMS(to: string, message: string) {
  if (!config.twilio.accountSid || !config.twilio.authToken || !config.twilio.phoneNumber) {
    logger.warn(`SMS to ${to} would be sent, but Twilio credentials are missing in .env: ${message}`);
    return;
  }

  try {
    // Dynamically require twilio to avoid crash if not installed,
    // but in a real app, it should be a dependency.
    const twilio = require('twilio');
    const client = twilio(config.twilio.accountSid, config.twilio.authToken);

    await client.messages.create({
      body: message,
      from: config.twilio.phoneNumber,
      to: to
    });

    logger.info(`SMS sent successfully to ${to}`);
  } catch (error: any) {
    logger.error(`Failed to send SMS to ${to}:`, error);
    // Don't throw to prevent breaking the main flow
  }
}
