import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddWhatsappPhoneNumberToCustomer1737145800000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Agregar columna whatsappPhoneNumber
    await queryRunner.addColumn(
      'customer',
      new TableColumn({
        name: 'whatsappPhoneNumber',
        type: 'varchar',
        length: '20',
        isNullable: true,
      }),
    );

    // Crear índice único para whatsappPhoneNumber (solo valores no nulos)
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_customer_whatsapp" ON "customer" ("whatsappPhoneNumber") WHERE "whatsappPhoneNumber" IS NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar índice único
    await queryRunner.query(`DROP INDEX "uq_customer_whatsapp"`);
    
    // Eliminar columna whatsappPhoneNumber
    await queryRunner.dropColumn('customer', 'whatsappPhoneNumber');
  }
}