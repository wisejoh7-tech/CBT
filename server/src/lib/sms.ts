import { logger } from "./logger";
import { config } from "./config";
import twilio from 'twilio';

/**
 * Formats a phone number into international E.164 format.
 * Automatically handles local numbers (e.g., 080... or 090... -> +23480...).
 */
export function formatPhoneNumber(phone: string): string {
  if (!phone) return "";
  const cleaned = phone.trim().replace(/[\s\-\(\)]/g, "");
  if (!cleaned) return "";

  if (cleaned.startsWith("+")) {
    return cleaned;
  }

  // Local Nigerian numbers starting with 0 (e.g. 08012345678)
  if (cleaned.startsWith("0") && cleaned.length === 11) {
    return "+234" + cleaned.slice(1);
  }

  // 10-digit number without leading 0
  if (cleaned.length === 10 && !cleaned.startsWith("0")) {
    return "+234" + cleaned;
  }

  return "+" + cleaned;
}

/**
 * Sends an SMS using Twilio.
 * Standardized for Production.
 */
export async function sendSMS(to: string, message: string) {
  if (!to) {
    logger.warn("SMS skipped: recipient phone number is empty.");
    return false;
  }

  const formattedTo = formatPhoneNumber(to);

  if (!config.twilio.accountSid || !config.twilio.authToken || !config.twilio.phoneNumber) {
    logger.warn(`SMS to ${formattedTo} skipped. Twilio credentials missing in .env.`);
    return false;
  }

  try {
    const client = twilio(config.twilio.accountSid, config.twilio.authToken);

    await client.messages.create({
      body: message,
      from: config.twilio.phoneNumber,
      to: formattedTo
    });

    logger.info(`SMS sent successfully to ${formattedTo}`);
    return true;
  } catch (error: any) {
    logger.error(`Failed to send SMS to ${formattedTo}:`, error.message);
    return false;
  }
}
