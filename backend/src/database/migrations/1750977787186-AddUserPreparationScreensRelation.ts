import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserPreparationScreensRelation1750977787186 implements MigrationInterface {
    name = 'AddUserPreparationScreensRelation1750977787186'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "user_preparation_screens" ("user_id" uuid NOT NULL, "preparation_screen_id" uuid NOT NULL, CONSTRAINT "PK_456b25e9e250eec37d3edafc75e" PRIMARY KEY ("user_id", "preparation_screen_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_460687f1d111e54d0ee465058c" ON "user_preparation_screens" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_8530b27197079ee22a084769e2" ON "user_preparation_screens" ("preparation_screen_id") `);
        await queryRunner.query(`ALTER TABLE "user_preparation_screens" ADD CONSTRAINT "FK_460687f1d111e54d0ee465058c7" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "user_preparation_screens" ADD CONSTRAINT "FK_8530b27197079ee22a084769e25" FOREIGN KEY ("preparation_screen_id") REFERENCES "preparation_screens"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_preparation_screens" DROP CONSTRAINT "FK_8530b27197079ee22a084769e25"`);
        await queryRunner.query(`ALTER TABLE "user_preparation_screens" DROP CONSTRAINT "FK_460687f1d111e54d0ee465058c7"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8530b27197079ee22a084769e2"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_460687f1d111e54d0ee465058c"`);
        await queryRunner.query(`DROP TABLE "user_preparation_screens"`);
    }

}
