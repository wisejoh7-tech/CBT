import { Entity, PrimaryColumn, Column, CreateDateColumn } from "typeorm";

@Entity()
export class Candidate {
  @PrimaryColumn({ type: "varchar", length: 50 })
  examNumber!: string;

  @Column({ type: "varchar", length: 255 })
  fullName!: string;

  @Column({ type: "varchar", length: 255, unique: true })
  email!: string;

  @Column({ type: "varchar", length: 20, nullable: true, unique: true })
  phoneNumber?: string;

  @Column({ type: "varchar", length: 255, nullable: true, select: false })
  password?: string;

  @Column({ type: "date", nullable: true })
  dateOfBirth?: string;

  @Column({ type: "varchar", length: 50, default: "active" })
  status!: string;

  @Column({ type: "boolean", default: false })
  thumbprinted!: boolean;

  @Column({ type: "text", nullable: true })
  thumbprintData?: string;

  @Column({ type: "varchar", length: 1024, nullable: true })
  faceUrl?: string;

  @Column({ type: "text", nullable: true })
  waecResultUrl?: string;

  @Column({ type: "varchar", length: 50, nullable: true })
  pin?: string;

  @Column({ type: "varchar", length: 45, nullable: true })
  assignedIp?: string;

  @Column({ type: "varchar", length: 20, nullable: true })
  assignedSeatNumber?: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  examVenue?: string;

  @Column({ type: "date", nullable: true })
  examDate?: string;

  @Column({ type: "time", nullable: true })
  examTime?: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  stateOfOrigin?: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  lga?: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  schoolAttended?: string;

  @Column({ type: "text", nullable: true })
  address?: string;

  @Column("simple-array")
  subjectCombination!: string[];

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;
}
