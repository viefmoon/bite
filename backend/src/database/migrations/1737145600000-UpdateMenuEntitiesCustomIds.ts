import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateMenuEntitiesCustomIds1737145600000
  implements MigrationInterface
{
  name = 'UpdateMenuEntitiesCustomIds1737145600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Subcategory - Cambiar tipo de columnas
    await queryRunner.query(`
      ALTER TABLE "subcategory" 
      ALTER COLUMN "id" TYPE varchar(20),
      ALTER COLUMN "category_id" TYPE varchar(20)
    `);

    // 2. Product - Cambiar tipo de columnas
    await queryRunner.query(`
      ALTER TABLE "product" 
      ALTER COLUMN "id" TYPE varchar(20),
      ALTER COLUMN "subcategory_id" TYPE varchar(20),
      ALTER COLUMN "preparation_screen_id" TYPE varchar(20)
    `);

    // 3. ProductVariant - Cambiar tipo de columnas
    await queryRunner.query(`
      ALTER TABLE "product_variant" 
      ALTER COLUMN "id" TYPE varchar(20),
      ALTER COLUMN "product_id" TYPE varchar(20)
    `);

    // 4. ModifierGroup - Cambiar tipo de columnas
    await queryRunner.query(`
      ALTER TABLE "modifier_group" 
      ALTER COLUMN "id" TYPE varchar(20)
    `);

    // 5. ProductModifier - Cambiar tipo de columnas
    await queryRunner.query(`
      ALTER TABLE "product_modifier" 
      ALTER COLUMN "id" TYPE varchar(20),
      ALTER COLUMN "group_id" TYPE varchar(20)
    `);

    // 6. PizzaIngredient - Cambiar tipo de columnas
    await queryRunner.query(`
      ALTER TABLE "pizza_ingredient" 
      ALTER COLUMN "id" TYPE varchar(20)
    `);

    // 7. Actualizar tablas de relación many-to-many
    // product_modifier_group
    await queryRunner.query(`
      ALTER TABLE "product_modifier_group" 
      ALTER COLUMN "product_id" TYPE varchar(20),
      ALTER COLUMN "modifier_group_id" TYPE varchar(20)
    `);

    // product_pizza_ingredient
    await queryRunner.query(`
      ALTER TABLE "product_pizza_ingredient" 
      ALTER COLUMN "product_id" TYPE varchar(20),
      ALTER COLUMN "pizza_ingredient_id" TYPE varchar(20)
    `);

    // 8. Actualizar otras tablas que referencian estas entidades
    // order_item
    await queryRunner.query(`
      ALTER TABLE "order_item" 
      ALTER COLUMN "product_id" TYPE varchar(20),
      ALTER COLUMN "product_variant_id" TYPE varchar(20)
    `);

    // order_item_modifier
    await queryRunner.query(`
      ALTER TABLE "order_item_modifier" 
      ALTER COLUMN "modifier_id" TYPE varchar(20)
    `);

    // selected_pizza_ingredient (si existe)
    await queryRunner.query(`
      DO $$ 
      BEGIN 
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'selected_pizza_ingredient') THEN
          ALTER TABLE "selected_pizza_ingredient" 
          ALTER COLUMN "pizza_ingredient_id" TYPE varchar(20);
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revertir todos los cambios (volver a uuid)
    // Nota: Esto solo funcionará si no hay datos con IDs personalizados
    
    // 1. Subcategory
    await queryRunner.query(`
      ALTER TABLE "subcategory" 
      ALTER COLUMN "id" TYPE uuid USING id::uuid,
      ALTER COLUMN "category_id" TYPE uuid USING category_id::uuid
    `);

    // 2. Product
    await queryRunner.query(`
      ALTER TABLE "product" 
      ALTER COLUMN "id" TYPE uuid USING id::uuid,
      ALTER COLUMN "subcategory_id" TYPE uuid USING subcategory_id::uuid,
      ALTER COLUMN "preparation_screen_id" TYPE uuid USING preparation_screen_id::uuid
    `);

    // 3. ProductVariant
    await queryRunner.query(`
      ALTER TABLE "product_variant" 
      ALTER COLUMN "id" TYPE uuid USING id::uuid,
      ALTER COLUMN "product_id" TYPE uuid USING product_id::uuid
    `);

    // 4. ModifierGroup
    await queryRunner.query(`
      ALTER TABLE "modifier_group" 
      ALTER COLUMN "id" TYPE uuid USING id::uuid
    `);

    // 5. ProductModifier
    await queryRunner.query(`
      ALTER TABLE "product_modifier" 
      ALTER COLUMN "id" TYPE uuid USING id::uuid,
      ALTER COLUMN "group_id" TYPE uuid USING group_id::uuid
    `);

    // 6. PizzaIngredient
    await queryRunner.query(`
      ALTER TABLE "pizza_ingredient" 
      ALTER COLUMN "id" TYPE uuid USING id::uuid
    `);

    // 7. Tablas de relación
    await queryRunner.query(`
      ALTER TABLE "product_modifier_group" 
      ALTER COLUMN "product_id" TYPE uuid USING product_id::uuid,
      ALTER COLUMN "modifier_group_id" TYPE uuid USING modifier_group_id::uuid
    `);

    await queryRunner.query(`
      ALTER TABLE "product_pizza_ingredient" 
      ALTER COLUMN "product_id" TYPE uuid USING product_id::uuid,
      ALTER COLUMN "pizza_ingredient_id" TYPE uuid USING pizza_ingredient_id::uuid
    `);

    // 8. Otras tablas
    await queryRunner.query(`
      ALTER TABLE "order_item" 
      ALTER COLUMN "product_id" TYPE uuid USING product_id::uuid,
      ALTER COLUMN "product_variant_id" TYPE uuid USING product_variant_id::uuid
    `);

    await queryRunner.query(`
      ALTER TABLE "order_item_modifier" 
      ALTER COLUMN "modifier_id" TYPE uuid USING modifier_id::uuid
    `);

    await queryRunner.query(`
      DO $$ 
      BEGIN 
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'selected_pizza_ingredient') THEN
          ALTER TABLE "selected_pizza_ingredient" 
          ALTER COLUMN "pizza_ingredient_id" TYPE uuid USING pizza_ingredient_id::uuid;
        END IF;
      END $$;
    `);
  }
}