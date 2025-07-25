import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMinimumOrderValueForDelivery1737313200000
  implements MigrationInterface
{
  name = 'AddMinimumOrderValueForDelivery1737313200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "restaurant_config" ADD "minimumOrderValueForDelivery" numeric(10,2) NOT NULL DEFAULT '0'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "restaurant_config" DROP COLUMN "minimumOrderValueForDelivery"`,
    );
  }
}
