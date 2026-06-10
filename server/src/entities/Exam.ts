import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from "typeorm";
import { Question } from "./Question";

@Entity()
export class Exam {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  title!: string;

  @Column({ type: "text", nullable: true })
  description?: string;

  @Column()
  subject!: string;

  @Column()
  durationMinutes!: number;

  @Column()
  totalQuestions!: number;

  @Column({ type: "timestamp", nullable: true })
  startTime?: Date;

  @Column({ type: "timestamp", nullable: true })
  endTime?: Date;

  @Column({ default: true })
  isActive!: boolean;

  @Column()
  createdBy!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @OneToMany(() => Question, (question) => question.exam, { cascade: true })
  questions!: Question[];
}
