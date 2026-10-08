import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class Attempt {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 100 })
  userId!: string;

  @Column({ type: "varchar", length: 100 })
  examId!: string;

  @Column({ type: "int", default: 0 })
  score!: number;

  @Column({ type: "int", default: 0 })
  totalPossible!: number;

  @Column({ type: "jsonb", default: () => "'{}'" })
  answers!: Record<string, number>;

  @Column("simple-array", { nullable: true })
  flagged?: string[];

  @Column({ type: "int", nullable: true })
  timeLeft?: number;

  @Column({ type: "int", default: 0 })
  currentQuestionIndex!: number;

  @Column({ type: "varchar", default: "in-progress" })
  status!: "in-progress" | "completed";

  @Column("jsonb", { nullable: true })
  results?: any;

  @Column("jsonb", { nullable: true })
  proctoringSnaps?: string[];

  @Column({ type: "double precision", default: 100.0 })
  trustScore!: number;

  @Column({ type: "boolean", default: false })
  isIdentityVerified!: boolean;

  @Column({ type: "boolean", default: false })
  isReleased!: boolean;

  @Column("jsonb", { default: () => "'[]'" })
  violationLogs!: any[];

  @CreateDateColumn({ type: "timestamptz" })
  startedAt!: Date;

  @UpdateDateColumn({ type: "timestamptz", nullable: true })
  completedAt?: Date;
}
