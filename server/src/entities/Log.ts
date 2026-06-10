import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity()
export class Log {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  type!: 'auth' | 'security' | 'exam' | 'system';

  @Column()
  severity!: 'info' | 'warning' | 'error' | 'critical';

  @Column()
  message!: string;

  @Column({ nullable: true })
  userId?: string;

  @Column("jsonb", { nullable: true })
  metadata?: any;

  @CreateDateColumn()
  timestamp!: Date;
}
