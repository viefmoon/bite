import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIsFromWhatsAppToOrder1750358400000 implements MigrationInterface {
  name = 'AddIsFromWhatsAppToOrder1750358400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "orders" ADD "is_from_whatsapp" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "orders" DROP COLUMN "is_from_whatsapp"`,
    );
  }
}