import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { Candidate } from "./Candidate";

export enum SeatStatus {
  AVAILABLE = "available",
  OCCUPIED = "occupied",
  RESERVED = "reserved",
  FAULTY = "faulty",
}

@Entity()
export class Seat {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 50 })
  seatNumber!: string;

  @Column({
    type: "enum",
    enum: SeatStatus,
    default: SeatStatus.AVAILABLE,
  })
  status!: SeatStatus;

  @Column({ type: "varchar", length: 50, nullable: true })
  assignedCandidateExamNumber?: string;

  @ManyToOne(() => Candidate)
  @JoinColumn({ name: "assignedCandidateExamNumber" })
  candidate?: Candidate;

  @Column({ type: "varchar", length: 100, nullable: true })
  ipAddress?: string;

  @Column({ type: "timestamp", nullable: true })
  lastActive?: Date;
}
