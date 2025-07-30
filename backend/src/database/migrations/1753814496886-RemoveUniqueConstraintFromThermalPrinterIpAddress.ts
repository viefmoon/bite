import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveUniqueConstraintFromThermalPrinterIpAddress1753814496886
  implements MigrationInterface
{
  name = 'RemoveUniqueConstraintFromThermalPrinterIpAddress1753814496886';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "thermal_printer" DROP CONSTRAINT "UQ_cd20a8ea69e128597672d5c7813"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "thermal_printer" ADD CONSTRAINT "UQ_cd20a8ea69e128597672d5c7813" UNIQUE ("ipAddress")`,
    );
  }
}
