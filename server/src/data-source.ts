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

if (!config.dbUrl) {
  console.error("❌ ERROR: DATABASE_URL is not defined in environment variables!");
} else {
  const host = config.dbUrl.split('@')[1]?.split('/')[0] || 'unknown';
  console.log(`[DB] Preparing connection to: ${host}`);
}

export const AppDataSource = new DataSource({
  type: "postgres",
  url: config.dbUrl || undefined,
  host: !config.dbUrl ? config.db.host : undefined,
  port: !config.dbUrl ? config.db.port : undefined,
  username: !config.dbUrl ? config.db.user : undefined,
  password: !config.dbUrl ? config.db.pass : undefined,
  database: !config.dbUrl ? config.db.name : undefined,
  synchronize: config.NODE_ENV !== "production",
  logging: config.NODE_ENV !== "production",
  ssl: (config.dbUrl?.includes("render.com") || config.db.host?.includes("render.com"))
    ? { rejectUnauthorized: false }
    : undefined,
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
