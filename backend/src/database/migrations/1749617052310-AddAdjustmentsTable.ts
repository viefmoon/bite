import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAdjustmentsTable1749617052310 implements MigrationInterface {
  name = 'AddAdjustmentsTable1749617052310';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."adjustment_type_enum" AS ENUM('discount', 'surcharge', 'custom')`,
    );
    await queryRunner.query(
      `CREATE TABLE "adjustment" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "public"."adjustment_type_enum" NOT NULL, "orderId" uuid, "orderItemId" uuid, "name" character varying(100) NOT NULL, "description" text, "isPercentage" boolean NOT NULL DEFAULT false, "value" numeric(10,2) NOT NULL DEFAULT '0', "amount" numeric(10,2) NOT NULL, "appliedById" uuid NOT NULL, "appliedAt" TIMESTAMP NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_f84d8d269b59850fb017ee1630b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b860d19aac2598cd33a2d77143" ON "adjustment" ("orderItemId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4a0fb0ce34a62a1d1536355589" ON "adjustment" ("orderId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "adjustment" ADD CONSTRAINT "FK_4a0fb0ce34a62a1d1536355589c" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "adjustment" ADD CONSTRAINT "FK_b860d19aac2598cd33a2d77143a" FOREIGN KEY ("orderItemId") REFERENCES "order_item"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "adjustment" ADD CONSTRAINT "FK_3462da297d831de3621394c5ebe" FOREIGN KEY ("appliedById") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "adjustment" DROP CONSTRAINT "FK_3462da297d831de3621394c5ebe"`,
    );
    await queryRunner.query(
      `ALTER TABLE "adjustment" DROP CONSTRAINT "FK_b860d19aac2598cd33a2d77143a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "adjustment" DROP CONSTRAINT "FK_4a0fb0ce34a62a1d1536355589c"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4a0fb0ce34a62a1d1536355589"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b860d19aac2598cd33a2d77143"`,
    );
    await queryRunner.query(`DROP TABLE "adjustment"`);
    await queryRunner.query(`DROP TYPE "public"."adjustment_type_enum"`);
  }
}
