import type { MigrationInterface, QueryRunner } from 'typeorm';

const NEW_SOURCES = ['builtin', 'remoteok', 'remotive', 'weworkremotely', 'hackernews'];

export class AddJobSources1795000000000 implements MigrationInterface {
  name = 'AddJobSources1795000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    for (const source of NEW_SOURCES) {
      await queryRunner.query(`ALTER TYPE "public"."jobs_source_enum" ADD VALUE IF NOT EXISTS '${source}'`);
    }
  }

  async down(): Promise<void> {
    // Postgres cannot drop enum values; removing them would mean deleting those sources' jobs. Left as-is.
  }
}
