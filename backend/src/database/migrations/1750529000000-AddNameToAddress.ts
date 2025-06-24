import { MigrationInterface, QueryRunner } from "typeorm";

export class AddNameToAddress1750529000000 implements MigrationInterface {
    name = 'AddNameToAddress1750529000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "address" ADD "name" character varying(100) NOT NULL DEFAULT 'Dirección Principal'`);
        
        // Actualizar las direcciones existentes con nombres basados en su tipo
        await queryRunner.query(`
            UPDATE "address" 
            SET "name" = CASE 
                WHEN "isDefault" = true THEN 'Casa'
                ELSE 'Dirección ' || SUBSTRING("id"::text, 1, 8)
            END
        `);
        
        // Remover el default después de actualizar
        await queryRunner.query(`ALTER TABLE "address" ALTER COLUMN "name" DROP DEFAULT`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "address" DROP COLUMN "name"`);
    }
}