import { Entity, PrimaryColumn, Column, CreateDateColumn } from "typeorm";

@Entity()
export class Candidate {
  @PrimaryColumn()
  examNumber!: string;

  @Column()
  fullName!: string;

  @Column({ unique: true })
  email!: string;

  @Column({ nullable: true, unique: true })
  phoneNumber?: string;

  @Column({ nullable: true, select: false })
  password?: string;

  @Column({ nullable: true })
  dateOfBirth?: string;

  @Column({ default: "active" })
  status!: string;

  @Column({ default: false })
  thumbprinted!: boolean;

  @Column({ type: "text", nullable: true })
  thumbprintData?: string;

  @Column({ nullable: true })
  faceUrl?: string;

  @Column({ type: "text", nullable: true })
  waecResultUrl?: string;

  @Column({ nullable: true })
  pin?: string;

  @Column({ nullable: true })
  assignedIp?: string;

  @Column({ nullable: true })
  assignedSeatNumber?: string;

  @Column({ nullable: true })
  examVenue?: string;

  @Column({ nullable: true })
  examDate?: string;

  @Column({ nullable: true })
  examTime?: string;

  @Column({ nullable: true })
  stateOfOrigin?: string;

  @Column({ nullable: true })
  lga?: string;

  @Column({ nullable: true })
  schoolAttended?: string;

  @Column({ type: "text", nullable: true })
  address?: string;

  @Column("simple-array")
  subjectCombination!: string[];

  @CreateDateColumn()
  createdAt!: Date;
}
