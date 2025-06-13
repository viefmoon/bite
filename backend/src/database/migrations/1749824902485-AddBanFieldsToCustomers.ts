import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBanFieldsToCustomers1749824902485
  implements MigrationInterface
{
  name = 'AddBanFieldsToCustomers1749824902485';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "customer" ADD "bannedAt" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(`ALTER TABLE "customer" ADD "banReason" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "customer" DROP COLUMN "banReason"`);
    await queryRunner.query(`ALTER TABLE "customer" DROP COLUMN "bannedAt"`);
  }
}
