import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "./entities/User";
import { Candidate } from "./entities/Candidate";
import { Exam } from "./entities/Exam";
import { Question } from "./entities/Question";
import { Attempt } from "./entities/Attempt";
import { Seat } from "./entities/Seat";
import { Log } from "./entities/Log";
import dotenv from "dotenv";

dotenv.config();

export const AppDataSource = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL || "postgres://postgres:password@localhost:5432/cbt_db",
  synchronize: process.env.NODE_ENV !== "production",
  logging: process.env.NODE_ENV !== "production",
  entities: [User, Candidate, Exam, Question, Attempt, Seat, Log],
  migrations: [process.env.NODE_ENV === "production" ? "dist/migrations/*.js" : "src/migrations/*.ts"],
  subscribers: [],
});
