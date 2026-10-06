import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { Exam } from "./Exam";
// ensure this path and export match your Exam entity

@Entity()
export class Question {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "text" })
  text!: string;

  @Column("simple-array")
  options!: string[];

  @Column({ type: "int" })
  correctOptionIndex!: number;

  @Column({ type: "text", nullable: true })
  explanation?: string;

  @Column({ type: "text", nullable: true })
  imageUrl?: string;

  @Column({ type: "varchar", length: 100, default: "General" })
  topic!: string;

  @ManyToOne(() => Exam, (exam) => exam.questions, { onDelete: "CASCADE" })
  exam!: Exam;
}
