import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1717750000000 implements MigrationInterface {
    name = 'InitialMigration1717750000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
        await queryRunner.query(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role_enum') THEN CREATE TYPE "user_role_enum" AS ENUM('student', 'super_admin', 'reg_admin', 'admin'); END IF; END $$`);
        await queryRunner.query(`CREATE TABLE "user" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "password" character varying NOT NULL, "displayName" character varying NOT NULL, "role" "user_role_enum" NOT NULL DEFAULT 'student', "examNumber" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "candidate" ("examNumber" character varying NOT NULL, "fullName" character varying NOT NULL, "email" character varying NOT NULL, "password" character varying, "dateOfBirth" character varying, "status" character varying NOT NULL DEFAULT 'active', "thumbprinted" boolean NOT NULL DEFAULT false, "thumbprintData" text, "faceUrl" character varying, "waecResultUrl" text, "subjectCombination" text NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_candidate_email" UNIQUE ("email"), CONSTRAINT "PK_candidate_examNumber" PRIMARY KEY ("examNumber"))`);
        await queryRunner.query(`CREATE TABLE "exam" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying NOT NULL, "description" text, "subject" character varying NOT NULL, "durationMinutes" integer NOT NULL, "totalQuestions" integer NOT NULL, "createdBy" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_exam_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "question" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "text" text NOT NULL, "options" text NOT NULL, "correctOptionIndex" integer NOT NULL, "explanation" text, "examId" uuid, CONSTRAINT "PK_question_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "attempt" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" character varying NOT NULL, "examId" character varying NOT NULL, "score" integer NOT NULL DEFAULT 0, "totalPossible" integer NOT NULL DEFAULT 0, "answers" jsonb NOT NULL DEFAULT '{}', "flagged" text, "timeLeft" integer, "currentQuestionIndex" integer NOT NULL DEFAULT 0, "status" character varying NOT NULL DEFAULT 'in-progress', "startedAt" TIMESTAMP NOT NULL DEFAULT now(), "completedAt" TIMESTAMP, CONSTRAINT "PK_attempt_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "question" ADD CONSTRAINT "FK_question_examId" FOREIGN KEY ("examId") REFERENCES "exam"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "question" DROP CONSTRAINT "FK_question_examId"`);
        await queryRunner.query(`DROP TABLE "attempt"`);
        await queryRunner.query(`DROP TABLE "question"`);
        await queryRunner.query(`DROP TABLE "exam"`);
        await queryRunner.query(`DROP TABLE "candidate"`);
        await queryRunner.query(`DROP TABLE "user"`);
    }

}
