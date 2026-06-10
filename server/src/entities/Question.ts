import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { Exam } from "./Exam";

@Entity()
export class Question {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "text" })
  text!: string;

  @Column("simple-array")
  options!: string[];

  @Column()
  correctOptionIndex!: number;

  @Column({ type: "text", nullable: true })
  explanation?: string;

  @Column({ type: "varchar", default: "General" })
  topic!: string;

  @ManyToOne(() => Exam, (exam) => exam.questions, { onDelete: "CASCADE" })
  exam!: Exam;
}
