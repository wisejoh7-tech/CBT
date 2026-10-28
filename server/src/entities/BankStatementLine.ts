import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from "typeorm";
import { BankStatement } from "./BankStatement";

@Entity()
export class BankStatementLine {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => BankStatement, (statement) => statement.lines, { onDelete: "CASCADE" })
  @JoinColumn({ name: "statementId" })
  statement!: BankStatement;

  @Column({ type: "uuid" })
  statementId!: string;

  @Column({ type: "timestamptz" })
  transactionDate!: Date;

  @Column({ type: "text" })
  description!: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  reference?: string;

  @Column({ type: "decimal", precision: 15, scale: 2 })
  amount!: number;

  @Column({ type: "varchar", length: 20, default: "credit" })
  type!: "credit" | "debit";

  @Column({ type: "varchar", length: 50, default: "unmatched" })
  status!: "unmatched" | "matched" | "discrepancy";

  @Column({ type: "uuid", nullable: true })
  matchedJournalEntryId?: string;

  @Column({ type: "timestamptz", nullable: true })
  matchedAt?: Date;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;
}
