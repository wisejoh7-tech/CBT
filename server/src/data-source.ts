import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "./entities/User";
import { Candidate } from "./entities/Candidate";
import { Exam } from "./entities/Exam";
import { Question } from "./entities/Question";
import { Attempt } from "./entities/Attempt";
import { Seat } from "./entities/Seat";
import { Log } from "./entities/Log";
import { Subject } from "./entities/Subject";
import { config } from "./lib/config";

export const AppDataSource = new DataSource({
  type: "postgres",
  url: config.DATABASE_URL,
  synchronize: config.NODE_ENV !== "production",
  logging: config.NODE_ENV !== "production",
  entities: [User, Candidate, Exam, Question, Attempt, Seat, Log, Subject],
  migrations: [config.NODE_ENV === "production" ? "dist/migrations/*.js" : "src/migrations/*.ts"],
  subscribers: [],
});
