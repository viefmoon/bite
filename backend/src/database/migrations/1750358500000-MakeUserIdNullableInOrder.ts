import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeUserIdNullableInOrder1750358500000 implements MigrationInterface {
  name = 'MakeUserIdNullableInOrder1750358500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Primero eliminar la restricción de foreign key
    await queryRunner.query(
      `ALTER TABLE "orders" DROP CONSTRAINT IF EXISTS "FK_a922b820eeef29ac1c6800e826a"`,
    );
    
    // Hacer la columna nullable
    await queryRunner.query(
      `ALTER TABLE "orders" ALTER COLUMN "user_id" DROP NOT NULL`,
    );
    
    // Recrear la restricción de foreign key
    await queryRunner.query(
      `ALTER TABLE "orders" ADD CONSTRAINT "FK_a922b820eeef29ac1c6800e826a" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar la restricción de foreign key
    await queryRunner.query(
      `ALTER TABLE "orders" DROP CONSTRAINT IF EXISTS "FK_a922b820eeef29ac1c6800e826a"`,
    );
    
    // Hacer la columna NOT NULL nuevamente (esto fallará si hay valores NULL)
    await queryRunner.query(
      `ALTER TABLE "orders" ALTER COLUMN "user_id" SET NOT NULL`,
    );
    
    // Recrear la restricción de foreign key
    await queryRunner.query(
      `ALTER TABLE "orders" ADD CONSTRAINT "FK_a922b820eeef29ac1c6800e826a" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}