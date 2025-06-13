import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWhatsappFieldsToCustomer1749831098046
  implements MigrationInterface
{
  name = 'AddWhatsappFieldsToCustomer1749831098046';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "customer" ADD "whatsappMessageCount" integer NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer" ADD "lastWhatsappMessageTime" TIMESTAMP WITH TIME ZONE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "customer" DROP COLUMN "lastWhatsappMessageTime"`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer" DROP COLUMN "whatsappMessageCount"`,
    );
  }
}
