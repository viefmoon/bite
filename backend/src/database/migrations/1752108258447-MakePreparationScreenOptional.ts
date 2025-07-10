import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakePreparationScreenOptional1752108258447
  implements MigrationInterface
{
  name = 'MakePreparationScreenOptional1752108258447';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "product" DROP CONSTRAINT "FK_43b6baaae5d58553d5269e26f6e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product" ALTER COLUMN "preparation_screen_id" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "product" ADD CONSTRAINT "FK_43b6baaae5d58553d5269e26f6e" FOREIGN KEY ("preparation_screen_id") REFERENCES "preparation_screens"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "product" DROP CONSTRAINT "FK_43b6baaae5d58553d5269e26f6e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product" ALTER COLUMN "preparation_screen_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "product" ADD CONSTRAINT "FK_43b6baaae5d58553d5269e26f6e" FOREIGN KEY ("preparation_screen_id") REFERENCES "preparation_screens"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
