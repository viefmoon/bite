import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

export enum EntityPrefix {
  CATEGORY = 'CAT',
  SUBCATEGORY = 'SUB',
  PRODUCT = 'PR',
  PRODUCT_VARIANT = 'PVA',
  MODIFIER_GROUP = 'MODG',
  MODIFIER = 'MOD',
  PIZZA_INGREDIENT = 'PI',
}

@Injectable()
export class CustomIdService {
  constructor(private readonly dataSource: DataSource) {}

  async generateId(prefix: EntityPrefix, tableName: string): Promise<string> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      // Start transaction to ensure atomicity
      await queryRunner.startTransaction();

      // Get the current maximum number for this prefix
      const result = await queryRunner.query(
        `SELECT MAX(CAST(SUBSTRING(id FROM LENGTH($1) + 2) AS INTEGER)) as max_num 
         FROM "${tableName}" 
         WHERE id LIKE $1 || '-%'`,
        [prefix],
      );

      const maxNum = result[0]?.max_num || 0;
      const nextNum = maxNum + 1;
      const newId = `${prefix}-${nextNum}`;

      await queryRunner.commitTransaction();

      return newId;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
