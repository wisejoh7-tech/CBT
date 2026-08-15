import { logger } from "./logger";
import { config } from "./config";
import twilio from 'twilio';

/**
 * Sends an SMS using Twilio.
 * Standardized for Production.
 */
export async function sendSMS(to: string, message: string) {
  if (!config.twilio.accountSid || !config.twilio.authToken || !config.twilio.phoneNumber) {
    logger.warn(`SMS to ${to} skipped. Twilio credentials missing in .env.`);
    return;
  }

  try {
    const client = twilio(config.twilio.accountSid, config.twilio.authToken);

    await client.messages.create({
      body: message,
      from: config.twilio.phoneNumber,
      to: to
    });

    logger.info(`SMS sent successfully to ${to}`);
  } catch (error: any) {
    logger.error(`Failed to send SMS to ${to}:`, error.message);
  }
}
