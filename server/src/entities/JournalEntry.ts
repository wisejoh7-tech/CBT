import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from "typeorm";
import { JournalLine } from "./JournalLine";

@Entity()
export class JournalEntry {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 100, unique: true })
  entryNumber!: string;

  @Column({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
  entryDate!: Date;

  @Column({ type: "text" })
  description!: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  reference?: string;

  @Column({ type: "varchar", length: 50, default: "posted" })
  status!: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  createdBy?: string;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @OneToMany(() => JournalLine, (line) => line.journalEntry, { cascade: true })
  lines!: JournalLine[];
}
