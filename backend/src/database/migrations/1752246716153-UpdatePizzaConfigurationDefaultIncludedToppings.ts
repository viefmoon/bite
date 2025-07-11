import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdatePizzaConfigurationDefaultIncludedToppings1752246716153
  implements MigrationInterface
{
  name = 'UpdatePizzaConfigurationDefaultIncludedToppings1752246716153';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "pizza_configuration" ALTER COLUMN "included_toppings" SET DEFAULT '0'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "pizza_configuration" ALTER COLUMN "included_toppings" SET DEFAULT '4'`,
    );
  }
}
