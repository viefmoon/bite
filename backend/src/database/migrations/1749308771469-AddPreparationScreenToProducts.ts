import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPreparationScreenToProducts1749308771469
  implements MigrationInterface
{
  name = 'AddPreparationScreenToProducts1749308771469';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_category_name_unique_not_deleted"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_product_name_unique_not_deleted"`,
    );
    await queryRunner.query(
      `ALTER TABLE "category" ADD CONSTRAINT "UQ_23c05c292c439d77b0de816b500" UNIQUE ("name")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "category" DROP CONSTRAINT "UQ_23c05c292c439d77b0de816b500"`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_product_name_unique_not_deleted" ON "product" ("name") WHERE ("deletedAt" IS NULL)`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_category_name_unique_not_deleted" ON "category" ("name") WHERE ("deletedAt" IS NULL)`,
    );
  }
}
