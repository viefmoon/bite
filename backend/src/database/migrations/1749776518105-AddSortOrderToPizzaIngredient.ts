import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSortOrderToPizzaIngredient1749776518105
  implements MigrationInterface
{
  name = 'AddSortOrderToPizzaIngredient1749776518105';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "pizza_ingredient" ADD "sort_order" integer NOT NULL DEFAULT '0'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "pizza_ingredient" DROP COLUMN "sort_order"`,
    );
  }
}
