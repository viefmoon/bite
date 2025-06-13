import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIsBannedToCustomer1749830359378 implements MigrationInterface {
  name = 'AddIsBannedToCustomer1749830359378';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "customer" ADD "isBanned" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "customer" DROP COLUMN "isBanned"`);
  }
}
