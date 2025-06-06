import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUniqueProductName1749244723331 implements MigrationInterface {
  name = 'AddUniqueProductName1749244723331';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Crear índice único para el nombre del producto, excluyendo registros eliminados
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_product_name_unique_not_deleted" ON "product" ("name") WHERE ("deletedAt" IS NULL)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar el índice único
    await queryRunner.query(
      `DROP INDEX "public"."IDX_product_name_unique_not_deleted"`,
    );
  }
}
