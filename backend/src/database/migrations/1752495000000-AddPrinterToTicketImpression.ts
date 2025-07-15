import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPrinterToTicketImpression1752495000000 implements MigrationInterface {
    name = 'AddPrinterToTicketImpression1752495000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "ticket_impression" ADD "printer_id" uuid`);
        await queryRunner.query(`ALTER TABLE "ticket_impression" ADD CONSTRAINT "FK_ticket_impression_printer" FOREIGN KEY ("printer_id") REFERENCES "thermal_printer"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "ticket_impression" DROP CONSTRAINT "FK_ticket_impression_printer"`);
        await queryRunner.query(`ALTER TABLE "ticket_impression" DROP COLUMN "printer_id"`);
    }
}