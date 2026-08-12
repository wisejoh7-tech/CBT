import twilio from "twilio";
import { config } from "./config"; // your config.ts

// Create Twilio client
const client = twilio(config.twilio.accountSid, config.twilio.authToken);

// Function to send SMS
export async function sendSMS(to: string, message: string) {
  try {
    const response = await client.messages.create({
      body: message,
      from: config.twilio.phoneNumber, // your Twilio number
      to: to, // recipient phone number
    });
    console.log("SMS sent:", response.sid);
    return response;
  } catch (error) {
    console.error("Error sending SMS:", error);
    throw error;
  }
}
