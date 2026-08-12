import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity()
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 255, unique: true })
  email!: string;

  @Column({ type: "varchar", length: 255 })
  password!: string;

  @Column({ type: "varchar", length: 255 })
  displayName!: string;

  @Column({
    type: "enum",
    enum: ["student", "super_admin", "reg_admin", "admin"],
    default: "student",
  })
  role!: "student" | "super_admin" | "reg_admin" | "admin";

  @Column({ type: "varchar", length: 100, nullable: true })
  examNumber?: string;

  @CreateDateColumn({ type: "timestamp with time zone" })
  createdAt!: Date;
}
