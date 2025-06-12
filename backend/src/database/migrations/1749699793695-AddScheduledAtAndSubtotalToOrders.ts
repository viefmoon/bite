import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddScheduledAtAndSubtotalToOrders1749699793695
  implements MigrationInterface
{
  name = 'AddScheduledAtAndSubtotalToOrders1749699793695';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "orders" ADD "scheduledAt" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD "subtotal" numeric(10,2) NOT NULL DEFAULT '0'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "subtotal"`);
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "scheduledAt"`);
  }
}
