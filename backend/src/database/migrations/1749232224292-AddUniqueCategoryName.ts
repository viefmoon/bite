import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUniqueCategoryName1749232224292 implements MigrationInterface {
  name = 'AddUniqueCategoryName1749232224292';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Crear un índice único parcial que solo considere registros no eliminados
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_category_name_unique_not_deleted" ON "category" ("name") WHERE "deletedAt" IS NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "IDX_category_name_unique_not_deleted"`,
    );
  }
}
