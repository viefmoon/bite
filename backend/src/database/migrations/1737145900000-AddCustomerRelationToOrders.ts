import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

export class AddCustomerRelationToOrders1737145900000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Agregar columna customer_id a la tabla orders
    await queryRunner.addColumn(
      'orders',
      new TableColumn({
        name: 'customer_id',
        type: 'uuid',
        isNullable: true,
      }),
    );

    // Crear foreign key hacia la tabla customer
    await queryRunner.createForeignKey(
      'orders',
      new TableForeignKey({
        columnNames: ['customer_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'customer',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      }),
    );

    // Crear índice para mejorar performance de las consultas
    await queryRunner.query(
      `CREATE INDEX "idx_orders_customer_id" ON "orders" ("customer_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar índice
    await queryRunner.query(`DROP INDEX "idx_orders_customer_id"`);

    // Eliminar foreign key
    const table = await queryRunner.getTable('orders');
    const foreignKey = table?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('customer_id') !== -1,
    );
    if (foreignKey) {
      await queryRunner.dropForeignKey('orders', foreignKey);
    }

    // Eliminar columna customer_id
    await queryRunner.dropColumn('orders', 'customer_id');
  }
}