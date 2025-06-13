import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangePizzaIngredientToManyToMany1749775702797
  implements MigrationInterface
{
  name = 'ChangePizzaIngredientToManyToMany1749775702797';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Crear la nueva tabla de relación muchos-a-muchos
    await queryRunner.query(
      `CREATE TABLE "product_pizza_ingredient" ("product_id" uuid NOT NULL, "pizza_ingredient_id" uuid NOT NULL, CONSTRAINT "PK_0106505cd24bc5f3fed0cedb4af" PRIMARY KEY ("product_id", "pizza_ingredient_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_631731d02a413e75985d9b18b5" ON "product_pizza_ingredient" ("product_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e826f9b32402d8a63dd6e2f065" ON "product_pizza_ingredient" ("pizza_ingredient_id") `,
    );

    // Migrar los datos existentes a la nueva tabla
    await queryRunner.query(
      `INSERT INTO "product_pizza_ingredient" ("product_id", "pizza_ingredient_id") 
       SELECT "product_id", "id" FROM "pizza_ingredient" 
       WHERE "product_id" IS NOT NULL`,
    );

    // Eliminar la constraint antigua
    await queryRunner.query(
      `ALTER TABLE "pizza_ingredient" DROP CONSTRAINT "FK_b177c2f166d5b6e4e4258782fd4"`,
    );

    // Eliminar la columna product_id
    await queryRunner.query(
      `ALTER TABLE "pizza_ingredient" DROP COLUMN "product_id"`,
    );

    // Agregar las constraints a la nueva tabla
    await queryRunner.query(
      `ALTER TABLE "product_pizza_ingredient" ADD CONSTRAINT "FK_631731d02a413e75985d9b18b54" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_pizza_ingredient" ADD CONSTRAINT "FK_e826f9b32402d8a63dd6e2f0655" FOREIGN KEY ("pizza_ingredient_id") REFERENCES "pizza_ingredient"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "product_pizza_ingredient" DROP CONSTRAINT "FK_e826f9b32402d8a63dd6e2f0655"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_pizza_ingredient" DROP CONSTRAINT "FK_631731d02a413e75985d9b18b54"`,
    );
    await queryRunner.query(
      `ALTER TABLE "pizza_ingredient" ADD "product_id" uuid`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e826f9b32402d8a63dd6e2f065"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_631731d02a413e75985d9b18b5"`,
    );
    await queryRunner.query(`DROP TABLE "product_pizza_ingredient"`);
    await queryRunner.query(
      `ALTER TABLE "pizza_ingredient" ADD CONSTRAINT "FK_b177c2f166d5b6e4e4258782fd4" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
