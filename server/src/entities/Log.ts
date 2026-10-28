import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

export enum LogType {
  AUTH = "auth",
  SECURITY = "security",
  EXAM = "exam",
  SYSTEM = "system",
  FINANCE = "finance",
}

export enum LogSeverity {
  INFO = "info",
  WARNING = "warning",
  ERROR = "error",
  CRITICAL = "critical",
}

@Entity()
export class Log {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({
    type: "enum",
    enum: LogType,
  })
  type!: LogType;

  @Column({
    type: "enum",
    enum: LogSeverity,
  })
  severity!: LogSeverity;

  @Column({ type: "text" })
  message!: string;

  @Column({ type: "uuid", nullable: true })
  userId?: string;

  @Column("jsonb", { nullable: true })
  metadata?: any;

  @CreateDateColumn({ type: "timestamptz" })
  timestamp!: Date;
}
