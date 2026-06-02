import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity()
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  password!: string;

  @Column()
  displayName!: string;

  @Column({
    type: "enum",
    enum: ["student", "super_admin", "reg_admin", "admin"],
    default: "student",
  })
  role!: string;

  @Column({ nullable: true })
  examNumber?: string;

  @CreateDateColumn()
  createdAt!: Date;
}
