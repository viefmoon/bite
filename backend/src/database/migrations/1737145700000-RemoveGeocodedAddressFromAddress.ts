import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class RemoveGeocodedAddressFromAddress1737145700000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Eliminar columna geocodedAddress de la tabla address
    await queryRunner.dropColumn('address', 'geocodedAddress');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Restaurar columna geocodedAddress
    await queryRunner.addColumn(
      'address',
      new TableColumn({
        name: 'geocodedAddress',
        type: 'text',
        isNullable: true,
      }),
    );
  }
}