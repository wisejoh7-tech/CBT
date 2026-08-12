import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity()
export class Subject {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("varchar", { unique: true })  // explicitly set type
  name!: string;

  @Column("boolean", { default: true }) // explicitly set type
  isActive!: boolean;

  @CreateDateColumn({ type: "timestamp" })
  createdAt!: Date;
}
