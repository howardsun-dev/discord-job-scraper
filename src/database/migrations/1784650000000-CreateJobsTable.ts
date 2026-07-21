import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateJobsTable1784650000000 implements MigrationInterface {
  name = 'CreateJobsTable1784650000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    await queryRunner.query(
      'CREATE TYPE "public"."jobs_source_enum" AS ENUM(\'indeed\', \'linkedin\', \'glassdoor\', \'reddit\')',
    );
    await queryRunner.query(`
      CREATE TABLE "jobs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "title" character varying(500) NOT NULL,
        "company" character varying(200) NOT NULL,
        "location" character varying(200) NOT NULL,
        "description" text NOT NULL,
        "url" text NOT NULL,
        "source" "public"."jobs_source_enum" NOT NULL,
        "externalId" character varying(100) NOT NULL,
        "postedDate" TIMESTAMP,
        "salary" character varying(200),
        "remote" boolean NOT NULL DEFAULT false,
        "keywords" text,
        "postedToDiscord" boolean NOT NULL DEFAULT false,
        "postedAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_jobs_source_external_id" UNIQUE ("source", "externalId"),
        CONSTRAINT "PK_jobs_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query('CREATE INDEX "IDX_jobs_posted_date" ON "jobs" ("postedDate")');
    await queryRunner.query('CREATE INDEX "IDX_jobs_title_company" ON "jobs" ("title", "company")');
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX "public"."IDX_jobs_title_company"');
    await queryRunner.query('DROP INDEX "public"."IDX_jobs_posted_date"');
    await queryRunner.query('DROP TABLE "jobs"');
    await queryRunner.query('DROP TYPE "public"."jobs_source_enum"');
  }
}
