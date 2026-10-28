import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class AdminBankAccount {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 255 })
  bankName!: string;

  @Column({ type: "varchar", length: 255 })
  accountName!: string;

  @Column({ type: "varchar", length: 100, unique: true })
  accountNumber!: string;

  @Column({ type: "varchar", length: 50, nullable: true })
  sortCode?: string;

  @Column({ type: "varchar", length: 10, default: "NGN" })
  currency!: string;

  @Column({ type: "decimal", precision: 15, scale: 2, default: 0 })
  balance!: number;

  @Column({ type: "boolean", default: true })
  isActive!: boolean;

  @Column({ type: "text", nullable: true })
  description?: string;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;
}
