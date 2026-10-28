import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

export type AccountType = "asset" | "liability" | "equity" | "revenue" | "expense";

@Entity()
export class Account {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 50, unique: true })
  code!: string;

  @Column({ type: "varchar", length: 255 })
  name!: string;

  @Column({
    type: "varchar",
    length: 50,
    default: "asset",
  })
  type!: AccountType;

  @Column({ type: "varchar", length: 10, default: "NGN" })
  currency!: string;

  @Column({ type: "decimal", precision: 15, scale: 2, default: 0 })
  balance!: number;

  @Column({ type: "text", nullable: true })
  description?: string;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;
}
