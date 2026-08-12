import dotenv from "dotenv";

if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}

export const config = {
  apiUrl: process.env.VITE_API_URL,
  socketUrl: process.env.VITE_SOCKET_URL,
  dbUrl: process.env.DATABASE_URL,
  redisUrl: process.env.REDIS_URL,
  JWT_SECRET: process.env.JWT_SECRET!,
  mail: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT) || 587,
  },
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    phoneNumber: process.env.TWILIO_PHONE_NUMBER,
  },
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: Number(process.env.PORT) || 3000,
} as const;
