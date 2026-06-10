import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class Attempt {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  userId!: string;

  @Column()
  examId!: string;

  @Column({ default: 0 })
  score!: number;

  @Column({ default: 0 })
  totalPossible!: number;

  @Column("jsonb", { default: {} })
  answers!: Record<string, number>;

  @Column("simple-array", { nullable: true })
  flagged?: string[];

  @Column({ nullable: true })
  timeLeft?: number;

  @Column({ default: 0 })
  currentQuestionIndex!: number;

  @Column({ default: "in-progress" })
  status!: 'in-progress' | 'completed';

  @Column("jsonb", { nullable: true })
  results?: any;

  @Column("jsonb", { nullable: true })
  proctoringSnaps?: string[];

  @Column({ type: "float", default: 100.0 })
  trustScore!: number;

  @Column({ default: false })
  isIdentityVerified!: boolean;

  @Column("jsonb", { default: [] })
  violationLogs!: any[];

  @CreateDateColumn()
  startedAt!: Date;

  @UpdateDateColumn()
  completedAt?: Date;
}
