import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { JournalEntry } from "./JournalEntry";
import { Account } from "./Account";

@Entity()
export class JournalLine {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => JournalEntry, (entry) => entry.lines, { onDelete: "CASCADE" })
  @JoinColumn({ name: "journalEntryId" })
  journalEntry!: JournalEntry;

  @Column({ type: "uuid" })
  journalEntryId!: string;

  @ManyToOne(() => Account, { eager: true, onDelete: "RESTRICT" })
  @JoinColumn({ name: "accountId" })
  account!: Account;

  @Column({ type: "uuid" })
  accountId!: string;

  @Column({ type: "decimal", precision: 15, scale: 2, default: 0 })
  debit!: number;

  @Column({ type: "decimal", precision: 15, scale: 2, default: 0 })
  credit!: number;

  @Column({ type: "varchar", length: 10, default: "NGN" })
  currency!: string;

  @Column({ type: "decimal", precision: 10, scale: 4, default: 1.0 })
  exchangeRate!: number;
}
