import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from "typeorm";
import { Question } from "./Question";

@Entity()
export class Exam {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 255 })
  title!: string;

  @Column({ type: "text", nullable: true })
  description?: string;

  @Column({ type: "varchar", length: 100 })
  subject!: string;

  @Column({ type: "int" })
  durationMinutes!: number;

  @Column({ type: "int" })
  totalQuestions!: number;

  @Column({ type: "timestamptz", nullable: true })
  startTime?: Date;

  @Column({ type: "timestamptz", nullable: true })
  endTime?: Date;

  @Column({ type: "boolean", default: true })
  isActive!: boolean;

  @Column({ type: "uuid" })
  createdBy!: string;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @OneToMany(() => Question, (question) => question.exam, { cascade: true })
  questions!: Question[];
}
