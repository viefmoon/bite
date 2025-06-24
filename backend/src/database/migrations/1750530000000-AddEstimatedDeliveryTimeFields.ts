import { MigrationInterface, QueryRunner } from "typeorm";

export class AddEstimatedDeliveryTimeFields1750530000000 implements MigrationInterface {
    name = 'AddEstimatedDeliveryTimeFields1750530000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Agregar campo estimatedDineInTime a restaurant_config
        await queryRunner.query(`ALTER TABLE "restaurant_config" ADD "estimatedDineInTime" integer NOT NULL DEFAULT 25`);
        
        // Agregar campo estimated_delivery_time a orders
        await queryRunner.query(`ALTER TABLE "orders" ADD "estimated_delivery_time" TIMESTAMP WITH TIME ZONE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "estimated_delivery_time"`);
        await queryRunner.query(`ALTER TABLE "restaurant_config" DROP COLUMN "estimatedDineInTime"`);
    }
}