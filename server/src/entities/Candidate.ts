import { Entity, PrimaryColumn, Column, CreateDateColumn } from "typeorm";

@Entity()
export class Candidate {
  @PrimaryColumn()
  examNumber!: string;

  @Column()
  fullName!: string;

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

  @Column("simple-array")
  subjectCombination!: string[];

  @CreateDateColumn()
  createdAt!: Date;
}
