import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveLastSyncedAtFromCustomer1750889513488
  implements MigrationInterface
{
  name = 'RemoveLastSyncedAtFromCustomer1750889513488';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "customer" DROP COLUMN "last_synced_at"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "customer" ADD "last_synced_at" TIMESTAMP WITH TIME ZONE`,
    );
  }
}
