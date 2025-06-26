import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNewRoles1750900000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Insertar los nuevos roles si no existen
    await queryRunner.query(`
      INSERT INTO "role" (id, name) 
      VALUES 
        (3, 'Manager'),
        (4, 'Cashier'),
        (5, 'Waiter'),
        (6, 'Kitchen'),
        (7, 'Delivery')
      ON CONFLICT (id) DO NOTHING;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar los nuevos roles
    await queryRunner.query(`
      DELETE FROM "role" 
      WHERE id IN (3, 4, 5, 6, 7);
    `);
  }
}