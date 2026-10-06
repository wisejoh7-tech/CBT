import "reflect-metadata";
import { DataSource } from "typeorm";
import { config } from "./lib/config";

// Entities
import { User } from "./entities/User";
import { Candidate } from "./entities/Candidate";
import { Exam } from "./entities/Exam";
import { Question } from "./entities/Question";
import { Attempt } from "./entities/Attempt";
import { Seat } from "./entities/Seat";
import { Log } from "./entities/Log";
import { Subject } from "./entities/Subject";

// Subscribers
import { SeatSubscriber } from "./subscribers/SeatSubscriber";
import { ExamSubscriber } from "./subscribers/ExamSubscriber";
import { CandidateSubscriber } from "./subscribers/CandidateSubscriber";

if (!config.dbUrl && !config.db.host) {
  console.warn("⚠️ WARN: Neither DATABASE_URL nor DB_HOST is defined in environment variables.");
} else if (config.dbUrl) {
  const host = config.dbUrl.split('@')[1]?.split('/')[0] || 'unknown';
  console.log(`[DB] Preparing connection to: ${host}`);
}

const isProduction = config.NODE_ENV === "production";
const isCloudPostgres = !!(
  config.dbUrl?.includes("render.com") ||
  config.dbUrl?.includes("sslmode=require") ||
  config.dbUrl?.includes("amazonaws.com") ||
  config.dbUrl?.includes("supabase") ||
  config.dbUrl?.includes("neon.tech") ||
  config.db.host?.includes("render.com") ||
  (isProduction && !config.dbUrl?.includes("localhost") && !config.dbUrl?.includes("127.0.0.1"))
);

export const AppDataSource = new DataSource({
  type: "postgres",
  url: config.dbUrl || undefined,
  host: !config.dbUrl ? (config.db.host || "localhost") : undefined,
  port: !config.dbUrl ? (config.db.port || 5432) : undefined,
  username: !config.dbUrl ? (config.db.user || "postgres") : undefined,
  password: !config.dbUrl ? (config.db.pass || "") : undefined,
  database: !config.dbUrl ? (config.db.name || "postgres") : undefined,
  synchronize: config.NODE_ENV !== "production",
  logging: config.NODE_ENV !== "production",
  ssl: isCloudPostgres ? { rejectUnauthorized: false } : undefined,
  extra: {
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 30000,
  },
  entities: [User, Candidate, Exam, Question, Attempt, Seat, Log, Subject],
  migrations: [],
  migrationsRun: false,
  subscribers: [
    SeatSubscriber,
    ExamSubscriber,
    CandidateSubscriber,
  ],
});
