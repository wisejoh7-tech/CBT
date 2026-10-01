import dotenv from "dotenv";

if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}

const PORT = Number(process.env.PORT) || 10000;
console.log(`[BOOT] Initializing on PORT: ${PORT}`);
console.log(`[BOOT] ENV Check: DB=${!!process.env.DATABASE_URL}, REDIS=${!!process.env.REDIS_URL}, JWT=${!!process.env.JWT_SECRET}`);

const requiredEnv = [
  'DATABASE_URL',
  'JWT_SECRET'
];

const optionalEnv = [
  'REDIS_URL',
  'GEMINI_API_KEY'
];

if (process.env.NODE_ENV === 'production') {
  const missingRequired = requiredEnv.filter(k => !process.env[k]);
  if (missingRequired.length > 0) {
    console.error(`FATAL ERROR: Missing required production environment variables: ${missingRequired.join(', ')}`);
    process.exit(1);
  }

  const missingOptional = optionalEnv.filter(k => !process.env[k]);
  if (missingOptional.length > 0) {
    console.warn(`[BOOT WARN] Missing optional production environment variables: ${missingOptional.join(', ')}. Optional features may be degraded.`);
  }
}

export const config = {
  apiUrl: process.env.VITE_API_URL,
  socketUrl: process.env.VITE_SOCKET_URL,
  dbUrl: process.env.DATABASE_URL,
  db: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    pass: process.env.DB_PASS,
    name: process.env.DB_NAME,
    port: Number(process.env.DB_PORT) || 5432,
  },
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
  PORT: Number(process.env.PORT) || 10000,
} as const;
