import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGeolocationToAddress1749789161257
  implements MigrationInterface
{
  name = 'AddGeolocationToAddress1749789161257';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "address" ADD "latitude" numeric(10,8)`,
    );
    await queryRunner.query(
      `ALTER TABLE "address" ADD "longitude" numeric(11,8)`,
    );
    await queryRunner.query(`ALTER TABLE "address" ADD "geocodedAddress" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "address" DROP COLUMN "geocodedAddress"`,
    );
    await queryRunner.query(`ALTER TABLE "address" DROP COLUMN "longitude"`);
    await queryRunner.query(`ALTER TABLE "address" DROP COLUMN "latitude"`);
  }
}
