import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDescriptionToProduct1749581277813
  implements MigrationInterface
{
  name = 'AddDescriptionToProduct1749581277813';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "product" ADD "description" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "product" DROP COLUMN "description"`);
  }
}
