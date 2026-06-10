import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class Seat {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  seatNumber!: string;

  @Column({ default: "available" })
  status!: 'available' | 'occupied' | 'faulty';

  @Column({ nullable: true })
  assignedCandidateId?: string;

  @Column({ nullable: true })
  ipAddress?: string;

  @Column({ type: "timestamp", nullable: true })
  lastActive?: Date;
}
