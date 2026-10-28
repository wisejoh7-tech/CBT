import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity()
export class PaymentTransaction {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 100, unique: true })
  reference!: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  candidateId?: string;

  @Column({ type: "decimal", precision: 15, scale: 2 })
  amount!: number;

  @Column({ type: "varchar", length: 10, default: "NGN" })
  currency!: string;

  @Column({ type: "varchar", length: 50, default: "card" })
  paymentMethod!: string;

  @Column({ type: "varchar", length: 50, default: "completed" })
  status!: string;

  @Column({ type: "varchar", length: 255, unique: true, nullable: true })
  idempotencyKey?: string;

  @Column({ type: "text", nullable: true })
  metadata?: string;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;
}
