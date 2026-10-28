import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from "typeorm";
import { BankStatementLine } from "./BankStatementLine";

@Entity()
export class BankStatement {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 255 })
  filename!: string;

  @Column({ type: "uuid", nullable: true })
  bankAccountId?: string;

  @Column({ type: "varchar", length: 255 })
  importedBy!: string;

  @Column({ type: "int", default: 0 })
  totalLines!: number;

  @Column({ type: "int", default: 0 })
  matchedLines!: number;

  @Column({ type: "int", default: 0 })
  unmatchedLines!: number;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @OneToMany(() => BankStatementLine, (line) => line.statement, { cascade: true })
  lines!: BankStatementLine[];
}
