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

export const AppDataSource = new DataSource({
  type: "postgres",
  url: config.dbUrl,
  synchronize: config.NODE_ENV !== "production",
  logging: config.NODE_ENV !== "production",
  ssl: config.dbUrl?.includes("render.com") ? { rejectUnauthorized: false } : false,
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
