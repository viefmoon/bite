import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOpeningClosingTimeToRestaurantConfig1749763952912
  implements MigrationInterface
{
  name = 'AddOpeningClosingTimeToRestaurantConfig1749763952912';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "restaurant_config" ADD "openingTime" TIME`,
    );
    await queryRunner.query(
      `ALTER TABLE "restaurant_config" ADD "closingTime" TIME`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "restaurant_config" DROP COLUMN "closingTime"`,
    );
    await queryRunner.query(
      `ALTER TABLE "restaurant_config" DROP COLUMN "openingTime"`,
    );
  }
}
