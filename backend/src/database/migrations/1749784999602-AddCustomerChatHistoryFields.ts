import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCustomerChatHistoryFields1749784999602
  implements MigrationInterface
{
  name = 'AddCustomerChatHistoryFields1749784999602';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "customer" ADD "birthDate" date`);
    await queryRunner.query(
      `ALTER TABLE "customer" ADD "fullChatHistory" jsonb`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer" ADD "relevantChatHistory" jsonb`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer" ADD "lastInteraction" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer" ADD "totalOrders" integer NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer" ADD "totalSpent" numeric(10,2) NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer" ADD "isActive" boolean NOT NULL DEFAULT true`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "customer" DROP COLUMN "isActive"`);
    await queryRunner.query(`ALTER TABLE "customer" DROP COLUMN "totalSpent"`);
    await queryRunner.query(`ALTER TABLE "customer" DROP COLUMN "totalOrders"`);
    await queryRunner.query(
      `ALTER TABLE "customer" DROP COLUMN "lastInteraction"`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer" DROP COLUMN "relevantChatHistory"`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer" DROP COLUMN "fullChatHistory"`,
    );
    await queryRunner.query(`ALTER TABLE "customer" DROP COLUMN "birthDate"`);
  }
}
