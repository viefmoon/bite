import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateCustomerFieldsRequirements1737145500000
  implements MigrationInterface
{
  name = 'UpdateCustomerFieldsRequirements1737145500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Hacer firstName y lastName nullable
    await queryRunner.query(
      `ALTER TABLE "customer" ALTER COLUMN "firstName" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer" ALTER COLUMN "lastName" DROP NOT NULL`,
    );
    
    // Hacer phoneNumber NOT NULL - primero actualizar registros existentes con valores nulos
    await queryRunner.query(
      `UPDATE "customer" SET "phoneNumber" = 'PENDIENTE' WHERE "phoneNumber" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer" ALTER COLUMN "phoneNumber" SET NOT NULL`,
    );
    
    // Actualizar el índice único de phoneNumber para que no tenga condición WHERE
    await queryRunner.query(
      `DROP INDEX "public"."uq_customer_phone"`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_customer_phone" ON "customer" ("phoneNumber")`,
    );
    
    // Eliminar columnas de WhatsApp
    await queryRunner.query(
      `ALTER TABLE "customer" DROP COLUMN "whatsappMessageCount"`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer" DROP COLUMN "lastWhatsappMessageTime"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Restaurar columnas de WhatsApp
    await queryRunner.query(
      `ALTER TABLE "customer" ADD "whatsappMessageCount" integer DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer" ADD "lastWhatsappMessageTime" TIMESTAMP WITH TIME ZONE`,
    );
    
    // Revertir el índice único de phoneNumber
    await queryRunner.query(
      `DROP INDEX "public"."uq_customer_phone"`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_customer_phone" ON "customer" ("phoneNumber") WHERE "phoneNumber" IS NOT NULL`,
    );
    
    // Hacer phoneNumber nullable nuevamente
    await queryRunner.query(
      `ALTER TABLE "customer" ALTER COLUMN "phoneNumber" DROP NOT NULL`,
    );
    
    // Hacer firstName y lastName NOT NULL nuevamente - actualizar registros con valores nulos primero
    await queryRunner.query(
      `UPDATE "customer" SET "firstName" = 'Sin Nombre' WHERE "firstName" IS NULL`,
    );
    await queryRunner.query(
      `UPDATE "customer" SET "lastName" = 'Sin Apellido' WHERE "lastName" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer" ALTER COLUMN "firstName" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer" ALTER COLUMN "lastName" SET NOT NULL`,
    );
  }
}