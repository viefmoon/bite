import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeCategoryDescriptionNullable1749149863129
  implements MigrationInterface
{
  name = 'MakeCategoryDescriptionNullable1749149863129';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "category" ALTER COLUMN "description" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "category" ALTER COLUMN "description" DROP DEFAULT`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "category" ALTER COLUMN "description" SET DEFAULT ''`,
    );
    await queryRunner.query(
      `ALTER TABLE "category" ALTER COLUMN "description" SET NOT NULL`,
    );
  }
}
