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
  host: config.db.host || undefined,
  port: config.db.port,
  username: config.db.user || undefined,
  password: config.db.pass || undefined,
  database: config.db.name || undefined,
  url: (!config.db.host && config.dbUrl) ? config.dbUrl : undefined,
  synchronize: config.NODE_ENV !== "production",
  logging: config.NODE_ENV !== "production",
  ssl: {
    rejectUnauthorized: false,
  },
  extra: {
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 30000,
  },
  entities: [User, Candidate, Exam, Question, Attempt, Seat, Log, Subject],
  migrations: [
    config.NODE_ENV === "production"
      ? "dist/migrations/*.js"
      : "src/migrations/*.ts"
  ],
  subscribers: [
    SeatSubscriber,
    ExamSubscriber,
    CandidateSubscriber,
  ],
});
