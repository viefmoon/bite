import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakePizzaIngredientProductIdOptional1749765209048
  implements MigrationInterface
{
  name = 'MakePizzaIngredientProductIdOptional1749765209048';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "pizza_ingredient" DROP CONSTRAINT "FK_b177c2f166d5b6e4e4258782fd4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "pizza_ingredient" ALTER COLUMN "product_id" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "pizza_ingredient" ADD CONSTRAINT "FK_b177c2f166d5b6e4e4258782fd4" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "pizza_ingredient" DROP CONSTRAINT "FK_b177c2f166d5b6e4e4258782fd4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "pizza_ingredient" ALTER COLUMN "product_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "pizza_ingredient" ADD CONSTRAINT "FK_b177c2f166d5b6e4e4258782fd4" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
