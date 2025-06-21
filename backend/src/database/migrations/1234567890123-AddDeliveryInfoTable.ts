import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDeliveryInfoTable1234567890123 implements MigrationInterface {
  name = 'AddDeliveryInfoTable1234567890123';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Crear la tabla delivery_info
    await queryRunner.query(`
      CREATE TABLE "delivery_info" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "order_id" uuid NOT NULL,
        "full_address" text,
        "street" character varying,
        "number" character varying,
        "interior_number" character varying,
        "neighborhood" character varying,
        "city" character varying,
        "state" character varying,
        "zip_code" character varying,
        "country" character varying,
        "recipient_name" character varying,
        "recipient_phone" character varying,
        "delivery_instructions" text,
        "latitude" numeric(10,8),
        "longitude" numeric(11,8),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_delivery_info_order_id" UNIQUE ("order_id"),
        CONSTRAINT "PK_delivery_info" PRIMARY KEY ("id")
      )
    `);

    // Agregar la relación con orders
    await queryRunner.query(`
      ALTER TABLE "delivery_info" 
      ADD CONSTRAINT "FK_delivery_info_order" 
      FOREIGN KEY ("order_id") 
      REFERENCES "orders"("id") 
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    // Migrar datos existentes de orders a delivery_info
    await queryRunner.query(`
      INSERT INTO "delivery_info" (
        "id",
        "order_id",
        "full_address",
        "recipient_name",
        "recipient_phone",
        "createdAt",
        "updatedAt"
      )
      SELECT 
        uuid_generate_v4(),
        id,
        delivery_address,
        customer_name,
        phone_number,
        NOW(),
        NOW()
      FROM "orders"
      WHERE delivery_address IS NOT NULL 
         OR phone_number IS NOT NULL 
         OR customer_name IS NOT NULL
    `);

    // Eliminar las columnas viejas de orders
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN IF EXISTS "delivery_address"`);
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN IF EXISTS "phone_number"`);
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN IF EXISTS "customer_name"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Restaurar las columnas en orders
    await queryRunner.query(`ALTER TABLE "orders" ADD "delivery_address" text`);
    await queryRunner.query(`ALTER TABLE "orders" ADD "phone_number" character varying`);
    await queryRunner.query(`ALTER TABLE "orders" ADD "customer_name" character varying`);

    // Migrar los datos de vuelta
    await queryRunner.query(`
      UPDATE "orders" o
      SET 
        delivery_address = di.full_address,
        phone_number = di.recipient_phone,
        customer_name = di.recipient_name
      FROM "delivery_info" di
      WHERE o.id = di.order_id
    `);

    // Eliminar la restricción de clave foránea
    await queryRunner.query(`ALTER TABLE "delivery_info" DROP CONSTRAINT "FK_delivery_info_order"`);

    // Eliminar la tabla delivery_info
    await queryRunner.query(`DROP TABLE "delivery_info"`);
  }
}