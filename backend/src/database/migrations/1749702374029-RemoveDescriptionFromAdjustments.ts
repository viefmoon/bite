import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveDescriptionFromAdjustments1749702374029
  implements MigrationInterface
{
  name = 'RemoveDescriptionFromAdjustments1749702374029';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "adjustment" DROP COLUMN "description"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "adjustment" ADD "description" text`);
  }
}
