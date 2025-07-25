import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1752788001059 implements MigrationInterface {
  name = 'InitialSchema1752788001059';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "role" ("id" integer NOT NULL, "name" character varying NOT NULL, CONSTRAINT "PK_b36bcfe02fc8de3c57a8b2391c2" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "file" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "path" character varying NOT NULL, CONSTRAINT "PK_36b46d232307066b3a2c9ea3a1d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "category" ("id" character varying(20) NOT NULL, "name" character varying NOT NULL, "description" character varying, "isActive" boolean NOT NULL DEFAULT true, "sortOrder" integer NOT NULL DEFAULT '0', "photo_id" uuid, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_23c05c292c439d77b0de816b500" UNIQUE ("name"), CONSTRAINT "PK_9c4e4a89e3674fc9f382d733f03" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "subcategory" ("id" character varying(20) NOT NULL, "name" character varying NOT NULL, "description" character varying, "isActive" boolean NOT NULL DEFAULT true, "sortOrder" integer NOT NULL DEFAULT '0', "category_id" character varying(20) NOT NULL, "photo_id" uuid, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_5ad0b82340b411f9463c8e9554d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "area" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "description" character varying NOT NULL DEFAULT '', "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_644ffaf8fbde4db798cb47712fe" UNIQUE ("name"), CONSTRAINT "PK_39d5e4de490139d6535d75f42ff" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "table" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "capacity" integer, "isActive" boolean NOT NULL DEFAULT true, "isAvailable" boolean NOT NULL DEFAULT true, "isTemporary" boolean NOT NULL DEFAULT false, "temporaryIdentifier" character varying, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "area_id" uuid NOT NULL, CONSTRAINT "PK_28914b55c485fc2d7a101b1b2a4" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "address" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(100) NOT NULL, "street" character varying(200) NOT NULL, "number" character varying(50) NOT NULL, "interiorNumber" character varying(50), "neighborhood" character varying(150), "city" character varying(100), "state" character varying(100), "zipCode" character varying(10), "country" character varying(100), "delivery_instructions" text, "latitude" numeric(10,8), "longitude" numeric(11,8), "isDefault" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "customer_id" uuid NOT NULL, CONSTRAINT "PK_d92de1f82754668b5f5f5dd4fd5" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_49bc1e3cd91c06dc434318abd9" ON "address" ("zipCode") `,
    );
    await queryRunner.query(
      `CREATE TABLE "customer" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "firstName" character varying(100), "lastName" character varying(100), "whatsappPhoneNumber" character varying(20) NOT NULL, "stripeCustomerId" character varying(255), "email" character varying(255), "birthDate" date, "fullChatHistory" jsonb, "relevantChatHistory" jsonb, "lastInteraction" TIMESTAMP WITH TIME ZONE, "totalOrders" integer NOT NULL DEFAULT '0', "totalSpent" numeric(10,2) NOT NULL DEFAULT '0', "isActive" boolean NOT NULL DEFAULT true, "isBanned" boolean NOT NULL DEFAULT false, "bannedAt" TIMESTAMP WITH TIME ZONE, "banReason" text, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_a7a13f4cacb744524e44dfdad32" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2af7646e11a0872eb9a0212545" ON "customer" ("firstName") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2b5187e7475dcc88f25bec3967" ON "customer" ("lastName") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_customer_whatsapp" ON "customer" ("whatsappPhoneNumber") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_customer_email" ON "customer" ("email") WHERE email IS NOT NULL`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."shift_status_enum" AS ENUM('OPEN', 'CLOSED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "shift" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "date" date NOT NULL, "global_shift_number" integer NOT NULL, "shift_number" integer NOT NULL DEFAULT '1', "opened_at" TIMESTAMP WITH TIME ZONE NOT NULL, "closed_at" TIMESTAMP WITH TIME ZONE, "initial_cash" numeric(10,2) NOT NULL, "final_cash" numeric(10,2), "total_sales" numeric(10,2), "total_orders" integer, "cash_difference" numeric(10,2), "status" "public"."shift_status_enum" NOT NULL DEFAULT 'OPEN', "notes" text, "close_notes" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "opened_by_id" uuid, "closed_by_id" uuid, CONSTRAINT "PK_53071a6485a1e9dc75ec3db54b9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_shift_date_shift_number" ON "shift" ("date", "shift_number") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_shift_status" ON "shift" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_shift_date" ON "shift" ("date") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."payment_paymentmethod_enum" AS ENUM('CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'TRANSFER', 'OTHER')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."payment_paymentstatus_enum" AS ENUM('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "payment" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "paymentMethod" "public"."payment_paymentmethod_enum" NOT NULL DEFAULT 'CASH', "amount" numeric(10,2) NOT NULL, "paymentStatus" "public"."payment_paymentstatus_enum" NOT NULL DEFAULT 'PENDING', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "order_id" uuid, CONSTRAINT "PK_fcaec7df5adf9cac408c686b2ab" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."thermal_printer_connectiontype_enum" AS ENUM('NETWORK', 'USB', 'SERIAL', 'BLUETOOTH')`,
    );
    await queryRunner.query(
      `CREATE TABLE "thermal_printer" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(100) NOT NULL, "connectionType" "public"."thermal_printer_connectiontype_enum" NOT NULL, "ipAddress" character varying, "port" integer, "path" character varying, "isActive" boolean NOT NULL DEFAULT true, "macAddress" character varying(17), "isDefaultPrinter" boolean NOT NULL DEFAULT false, "autoDeliveryPrint" boolean NOT NULL DEFAULT false, "autoPickupPrint" boolean NOT NULL DEFAULT false, "paperWidth" integer NOT NULL DEFAULT '80', "charactersPerLine" integer NOT NULL DEFAULT '48', "cutPaper" boolean NOT NULL DEFAULT true, "feedLines" integer NOT NULL DEFAULT '3', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_cd20a8ea69e128597672d5c7813" UNIQUE ("ipAddress"), CONSTRAINT "PK_fa2e4d506b3ae2a00b5c62d894c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cd20a8ea69e128597672d5c781" ON "thermal_printer" ("ipAddress") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7f20d400228dc58a946e3b4ecb" ON "thermal_printer" ("macAddress") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."ticket_impression_tickettype_enum" AS ENUM('KITCHEN', 'BAR', 'BILLING', 'CUSTOMER_COPY', 'GENERAL')`,
    );
    await queryRunner.query(
      `CREATE TABLE "ticket_impression" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "order_id" uuid NOT NULL, "user_id" uuid NOT NULL, "printer_id" uuid, "ticketType" "public"."ticket_impression_tickettype_enum" NOT NULL, "impression_time" TIMESTAMP WITH TIME ZONE NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_58ccde2bdf3edda5fda63d62965" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "adjustment" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "orderId" uuid, "orderItemId" uuid, "name" character varying(100) NOT NULL, "isPercentage" boolean NOT NULL DEFAULT false, "value" numeric(10,2) NOT NULL DEFAULT '0', "amount" numeric(10,2) NOT NULL, "appliedById" uuid NOT NULL, "appliedAt" TIMESTAMP NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_f84d8d269b59850fb017ee1630b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b860d19aac2598cd33a2d77143" ON "adjustment" ("orderItemId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4a0fb0ce34a62a1d1536355589" ON "adjustment" ("orderId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "delivery_info" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "order_id" uuid NOT NULL, "full_address" text, "street" character varying, "number" character varying, "interior_number" character varying, "neighborhood" character varying, "city" character varying, "state" character varying, "zip_code" character varying, "country" character varying, "recipient_name" character varying, "recipient_phone" character varying, "delivery_instructions" text, "latitude" numeric(10,8), "longitude" numeric(11,8), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_2af51779cec2b29aa564e8547b5" UNIQUE ("order_id"), CONSTRAINT "REL_2af51779cec2b29aa564e8547b" UNIQUE ("order_id"), CONSTRAINT "PK_7e51a51ae402707415bef51c6d4" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."order_preparation_screen_status_status_enum" AS ENUM('PENDING', 'IN_PREPARATION', 'READY')`,
    );
    await queryRunner.query(
      `CREATE TABLE "order_preparation_screen_status" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "order_id" uuid NOT NULL, "preparation_screen_id" uuid NOT NULL, "status" "public"."order_preparation_screen_status_status_enum" NOT NULL DEFAULT 'PENDING', "startedAt" TIMESTAMP WITH TIME ZONE, "completedAt" TIMESTAMP WITH TIME ZONE, "started_by_id" uuid, "completed_by_id" uuid, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_4cc383eb1e5bad9c32eabd0fb5b" UNIQUE ("order_id", "preparation_screen_id"), CONSTRAINT "PK_d6616b40d43ccf71d4bd6cdf251" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9ed77bea90710afe76a90f6202" ON "order_preparation_screen_status" ("order_id", "status") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."orders_orderstatus_enum" AS ENUM('PENDING', 'IN_PROGRESS', 'IN_PREPARATION', 'READY', 'IN_DELIVERY', 'DELIVERED', 'COMPLETED', 'CANCELLED')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."orders_ordertype_enum" AS ENUM('DINE_IN', 'TAKE_AWAY', 'DELIVERY')`,
    );
    await queryRunner.query(
      `CREATE TABLE "orders" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "shift_order_number" integer NOT NULL, "shift_id" uuid NOT NULL, "user_id" uuid, "table_id" uuid, "orderStatus" "public"."orders_orderstatus_enum" NOT NULL DEFAULT 'IN_PROGRESS', "orderType" "public"."orders_ordertype_enum" NOT NULL DEFAULT 'DINE_IN', "scheduledAt" TIMESTAMP WITH TIME ZONE, "subtotal" numeric(10,2) NOT NULL DEFAULT '0', "total" numeric(10,2) NOT NULL DEFAULT '0', "notes" text, "customer_id" uuid, "is_from_whatsapp" boolean NOT NULL DEFAULT false, "estimated_delivery_time" TIMESTAMP WITH TIME ZONE, "finalized_at" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_710e2d4957aa5878dfe94e4ac2f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."pizza_customization_type_enum" AS ENUM('FLAVOR', 'INGREDIENT')`,
    );
    await queryRunner.query(
      `CREATE TABLE "pizza_customization" ("id" character varying(50) NOT NULL, "name" character varying NOT NULL, "type" "public"."pizza_customization_type_enum" NOT NULL DEFAULT 'INGREDIENT', "ingredients" text, "topping_value" integer NOT NULL DEFAULT '1', "is_active" boolean NOT NULL DEFAULT true, "sort_order" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_c34de896262f8a0181e9be39da9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."selected_pizza_customization_half_enum" AS ENUM('FULL', 'HALF_1', 'HALF_2')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."selected_pizza_customization_action_enum" AS ENUM('ADD', 'REMOVE')`,
    );
    await queryRunner.query(
      `CREATE TABLE "selected_pizza_customization" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "order_item_id" uuid NOT NULL, "pizza_customization_id" character varying(50) NOT NULL, "half" "public"."selected_pizza_customization_half_enum" NOT NULL DEFAULT 'FULL', "action" "public"."selected_pizza_customization_action_enum" NOT NULL DEFAULT 'ADD', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_8779dd2df5f34fc274f935b2643" UNIQUE ("order_item_id", "pizza_customization_id", "half", "action"), CONSTRAINT "PK_38d567a986aa95dbde8cb34af46" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "modifier_group" ("id" character varying(20) NOT NULL, "name" character varying NOT NULL, "description" character varying, "minSelections" integer NOT NULL DEFAULT '0', "maxSelections" integer NOT NULL, "isRequired" boolean NOT NULL DEFAULT false, "allowMultipleSelections" boolean NOT NULL DEFAULT false, "isActive" boolean NOT NULL DEFAULT true, "sortOrder" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_bda4dae1e8b5e69941a9c26b363" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "product_modifier" ("id" character varying(20) NOT NULL, "modifier_group_id" character varying(20) NOT NULL, "name" character varying NOT NULL, "description" character varying, "price" numeric(10,2), "sort_order" integer NOT NULL DEFAULT '0', "is_default" boolean NOT NULL DEFAULT false, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_cc4550313748a41f5e5af826e20" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."order_item_preparationstatus_enum" AS ENUM('PENDING', 'IN_PROGRESS', 'READY', 'DELIVERED', 'CANCELLED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "order_item" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "order_id" uuid NOT NULL, "product_id" character varying NOT NULL, "product_variant_id" character varying, "basePrice" numeric(10,2) NOT NULL, "finalPrice" numeric(10,2) NOT NULL, "preparationStatus" "public"."order_item_preparationstatus_enum" NOT NULL DEFAULT 'PENDING', "statusChangedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "preparationNotes" character varying, "preparedAt" TIMESTAMP WITH TIME ZONE, "prepared_by_id" uuid, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_d01158fe15b1ead5c26fd7f4e90" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "product_variant" ("id" character varying(20) NOT NULL, "product_id" character varying(20) NOT NULL, "name" character varying NOT NULL, "price" numeric(10,2) NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "sortOrder" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_1ab69c9935c61f7c70791ae0a9f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "pizza_configuration" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "product_id" character varying NOT NULL, "included_toppings" integer NOT NULL DEFAULT '0', "extra_topping_cost" numeric(10,2) NOT NULL DEFAULT '20', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_89f61ab515bf344975fd9811313" UNIQUE ("product_id"), CONSTRAINT "REL_89f61ab515bf344975fd981131" UNIQUE ("product_id"), CONSTRAINT "PK_4cac6f06b77ee88633bb1706e00" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "product" ("id" character varying(20) NOT NULL, "name" character varying NOT NULL, "description" text, "price" numeric(10,2), "hasVariants" boolean NOT NULL DEFAULT false, "isActive" boolean NOT NULL DEFAULT true, "is_pizza" boolean NOT NULL DEFAULT false, "sortOrder" integer NOT NULL DEFAULT '0', "subcategory_id" character varying(20) NOT NULL, "photo_id" uuid, "estimatedPrepTime" integer NOT NULL, "preparation_screen_id" uuid, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_bebc9158e480b949565b4dc7a82" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "preparation_screens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(100) NOT NULL, "description" character varying(255), "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_7ac7b3fa4460e49952d274aa1d5" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."user_gender_enum" AS ENUM('male', 'female', 'other', 'prefer_not_to_say')`,
    );
    await queryRunner.query(
      `CREATE TABLE "user" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying, "username" character varying NOT NULL, "password" character varying, "firstName" character varying, "lastName" character varying, "birthDate" date, "gender" "public"."user_gender_enum", "phoneNumber" character varying, "address" character varying, "city" character varying, "state" character varying, "country" character varying, "zipCode" character varying, "emergencyContact" jsonb, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "roleId" integer NOT NULL, "preparationScreenId" uuid, CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "UQ_78a916df40e02a9deb1c4b75edb" UNIQUE ("username"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_58e4dbff0e1a32a9bdc861bb29" ON "user" ("firstName") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f0e1b4ecdca13b177e2e3a0613" ON "user" ("lastName") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."sync_activity_type_enum" AS ENUM('PULL_CHANGES', 'RESTAURANT_DATA', 'ORDER_STATUS')`,
    );
    await queryRunner.query(
      `CREATE TABLE "sync_activity" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "public"."sync_activity_type_enum" NOT NULL, "direction" character varying(10) NOT NULL, "success" boolean NOT NULL DEFAULT true, "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_6317920934104aee696f8439424" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "session" ("id" SERIAL NOT NULL, "hash" character varying NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "userId" uuid, CONSTRAINT "PK_f55da76ac1c3ac420f444d2ff11" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3d2f174ef04fb312fdebd0ddc5" ON "session" ("userId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "business_hours" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "dayOfWeek" integer NOT NULL, "openingTime" TIME, "closingTime" TIME, "isClosed" boolean NOT NULL DEFAULT false, "restaurant_config_id" uuid NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_35ab61b36059d2fe8461fd1c11d" UNIQUE ("restaurant_config_id", "dayOfWeek"), CONSTRAINT "PK_560a76077605005da835fe505a5" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "restaurant_config" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "restaurantName" character varying(200) NOT NULL DEFAULT 'Restaurant', "phoneMain" character varying(20), "phoneSecondary" character varying(20), "address" text, "city" character varying(100), "state" character varying(100), "postalCode" character varying(20), "country" character varying(100), "acceptingOrders" boolean NOT NULL DEFAULT true, "estimatedPickupTime" integer NOT NULL DEFAULT '20', "estimatedDeliveryTime" integer NOT NULL DEFAULT '40', "estimatedDineInTime" integer NOT NULL DEFAULT '25', "openingGracePeriod" integer NOT NULL DEFAULT '30', "closingGracePeriod" integer NOT NULL DEFAULT '30', "timeZone" character varying(50) NOT NULL DEFAULT 'America/Mexico_City', "scheduledOrdersLeadTime" integer NOT NULL DEFAULT '60', "deliveryCoverageArea" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_7507a8162b2370c15747a6e546d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "order_history" ("id" SERIAL NOT NULL, "order_id" uuid NOT NULL, "operation" character varying(10) NOT NULL, "changed_by" uuid NOT NULL, "changed_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "diff" jsonb, "snapshot" jsonb NOT NULL, CONSTRAINT "PK_cc71513680d03ecb01b96655b0c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a2937c330238ea84f26c912104" ON "order_history" ("order_id", "changed_at") `,
    );
    await queryRunner.query(
      `CREATE TABLE "order_item_product_modifiers" ("order_item_id" uuid NOT NULL, "product_modifier_id" character varying(20) NOT NULL, CONSTRAINT "PK_65a1f401639e329d75e8a456eca" PRIMARY KEY ("order_item_id", "product_modifier_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_174da1d397a53ad90de24113aa" ON "order_item_product_modifiers" ("order_item_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ab1f24d4d8899260a7f3a220a7" ON "order_item_product_modifiers" ("product_modifier_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "product_modifier_group" ("product_id" character varying(20) NOT NULL, "modifier_group_id" character varying(20) NOT NULL, CONSTRAINT "PK_37bc0163dbdbccfc385cf524d57" PRIMARY KEY ("product_id", "modifier_group_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e35ee74f60bf7607fcfa5b5a44" ON "product_modifier_group" ("product_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5b42ef2ec32ad54c8df5de8833" ON "product_modifier_group" ("modifier_group_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "product_pizza_customization" ("product_id" character varying(20) NOT NULL, "pizza_customization_id" character varying(50) NOT NULL, CONSTRAINT "PK_d05a432ca912f8f61a64bd86828" PRIMARY KEY ("product_id", "pizza_customization_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_36cfc9221deb83153bdc348908" ON "product_pizza_customization" ("product_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a370300f78f7d36da3e12bc61b" ON "product_pizza_customization" ("pizza_customization_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "category" ADD CONSTRAINT "FK_0b23b34cf4f29fdcac4a65d9b62" FOREIGN KEY ("photo_id") REFERENCES "file"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "subcategory" ADD CONSTRAINT "FK_b36496504b71c57762246db74d7" FOREIGN KEY ("photo_id") REFERENCES "file"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "subcategory" ADD CONSTRAINT "FK_23584d8b8d26287e4fca0e1aaab" FOREIGN KEY ("category_id") REFERENCES "category"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "table" ADD CONSTRAINT "FK_65407279bef3b9e1458bb4ac588" FOREIGN KEY ("area_id") REFERENCES "area"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "address" ADD CONSTRAINT "FK_9c9614b2f9d01665800ea8dbff7" FOREIGN KEY ("customer_id") REFERENCES "customer"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "shift" ADD CONSTRAINT "FK_5f6b7929ee1eab2ac3429c31572" FOREIGN KEY ("opened_by_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "shift" ADD CONSTRAINT "FK_9213f00f25e73a46f8939951508" FOREIGN KEY ("closed_by_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment" ADD CONSTRAINT "FK_f5221735ace059250daac9d9803" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ticket_impression" ADD CONSTRAINT "FK_39045644ff19bb02fc961bb482f" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ticket_impression" ADD CONSTRAINT "FK_bdcc1d40a49fed2ee030cc0aac5" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ticket_impression" ADD CONSTRAINT "FK_a606de7eac1188f69862ed98974" FOREIGN KEY ("printer_id") REFERENCES "thermal_printer"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
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
    await queryRunner.query(
      `ALTER TABLE "delivery_info" ADD CONSTRAINT "FK_2af51779cec2b29aa564e8547b5" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_preparation_screen_status" ADD CONSTRAINT "FK_032eb00af16911d930cd78964b9" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_preparation_screen_status" ADD CONSTRAINT "FK_1d8a43c801b71b1513311f1ed2e" FOREIGN KEY ("preparation_screen_id") REFERENCES "preparation_screens"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_preparation_screen_status" ADD CONSTRAINT "FK_e863dab712b10b8b468bde6baf1" FOREIGN KEY ("started_by_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_preparation_screen_status" ADD CONSTRAINT "FK_e5e6be61e60a72ae6a37d51f08d" FOREIGN KEY ("completed_by_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD CONSTRAINT "FK_a47d559598368bc78800dd5175b" FOREIGN KEY ("shift_id") REFERENCES "shift"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD CONSTRAINT "FK_a922b820eeef29ac1c6800e826a" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD CONSTRAINT "FK_3d36410e89a795172fa6e0dd968" FOREIGN KEY ("table_id") REFERENCES "table"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD CONSTRAINT "FK_772d0ce0473ac2ccfa26060dbe9" FOREIGN KEY ("customer_id") REFERENCES "customer"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "selected_pizza_customization" ADD CONSTRAINT "FK_af0507c028ab56aa1857150fb3c" FOREIGN KEY ("order_item_id") REFERENCES "order_item"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "selected_pizza_customization" ADD CONSTRAINT "FK_506bfd144314f3a36669d4366a8" FOREIGN KEY ("pizza_customization_id") REFERENCES "pizza_customization"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_modifier" ADD CONSTRAINT "FK_d2bb79aa24d24bfaa21687de8c6" FOREIGN KEY ("modifier_group_id") REFERENCES "modifier_group"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_item" ADD CONSTRAINT "FK_4f22693817205af9eb18672c473" FOREIGN KEY ("prepared_by_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_item" ADD CONSTRAINT "FK_e9674a6053adbaa1057848cddfa" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_item" ADD CONSTRAINT "FK_5e17c017aa3f5164cb2da5b1c6b" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_item" ADD CONSTRAINT "FK_19fe8036263238b4fb3866243bf" FOREIGN KEY ("product_variant_id") REFERENCES "product_variant"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_variant" ADD CONSTRAINT "FK_ca67dd080aac5ecf99609960cd2" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "pizza_configuration" ADD CONSTRAINT "FK_89f61ab515bf344975fd9811313" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "product" ADD CONSTRAINT "FK_6c701613676cfa922e429eb1bae" FOREIGN KEY ("photo_id") REFERENCES "file"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "product" ADD CONSTRAINT "FK_0c9ba3f2d09244e06fc22ff618d" FOREIGN KEY ("subcategory_id") REFERENCES "subcategory"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "product" ADD CONSTRAINT "FK_43b6baaae5d58553d5269e26f6e" FOREIGN KEY ("preparation_screen_id") REFERENCES "preparation_screens"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD CONSTRAINT "FK_c28e52f758e7bbc53828db92194" FOREIGN KEY ("roleId") REFERENCES "role"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD CONSTRAINT "FK_72a26f0f47516be04ae20149289" FOREIGN KEY ("preparationScreenId") REFERENCES "preparation_screens"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "session" ADD CONSTRAINT "FK_3d2f174ef04fb312fdebd0ddc53" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_hours" ADD CONSTRAINT "FK_26f01c683dff7f6253d7b2b22c7" FOREIGN KEY ("restaurant_config_id") REFERENCES "restaurant_config"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_item_product_modifiers" ADD CONSTRAINT "FK_174da1d397a53ad90de24113aa7" FOREIGN KEY ("order_item_id") REFERENCES "order_item"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_item_product_modifiers" ADD CONSTRAINT "FK_ab1f24d4d8899260a7f3a220a7d" FOREIGN KEY ("product_modifier_id") REFERENCES "product_modifier"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_modifier_group" ADD CONSTRAINT "FK_e35ee74f60bf7607fcfa5b5a44e" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_modifier_group" ADD CONSTRAINT "FK_5b42ef2ec32ad54c8df5de88337" FOREIGN KEY ("modifier_group_id") REFERENCES "modifier_group"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_pizza_customization" ADD CONSTRAINT "FK_36cfc9221deb83153bdc3489087" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_pizza_customization" ADD CONSTRAINT "FK_a370300f78f7d36da3e12bc61b3" FOREIGN KEY ("pizza_customization_id") REFERENCES "pizza_customization"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "product_pizza_customization" DROP CONSTRAINT "FK_a370300f78f7d36da3e12bc61b3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_pizza_customization" DROP CONSTRAINT "FK_36cfc9221deb83153bdc3489087"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_modifier_group" DROP CONSTRAINT "FK_5b42ef2ec32ad54c8df5de88337"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_modifier_group" DROP CONSTRAINT "FK_e35ee74f60bf7607fcfa5b5a44e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_item_product_modifiers" DROP CONSTRAINT "FK_ab1f24d4d8899260a7f3a220a7d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_item_product_modifiers" DROP CONSTRAINT "FK_174da1d397a53ad90de24113aa7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_hours" DROP CONSTRAINT "FK_26f01c683dff7f6253d7b2b22c7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "session" DROP CONSTRAINT "FK_3d2f174ef04fb312fdebd0ddc53"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" DROP CONSTRAINT "FK_72a26f0f47516be04ae20149289"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" DROP CONSTRAINT "FK_c28e52f758e7bbc53828db92194"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product" DROP CONSTRAINT "FK_43b6baaae5d58553d5269e26f6e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product" DROP CONSTRAINT "FK_0c9ba3f2d09244e06fc22ff618d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product" DROP CONSTRAINT "FK_6c701613676cfa922e429eb1bae"`,
    );
    await queryRunner.query(
      `ALTER TABLE "pizza_configuration" DROP CONSTRAINT "FK_89f61ab515bf344975fd9811313"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_variant" DROP CONSTRAINT "FK_ca67dd080aac5ecf99609960cd2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_item" DROP CONSTRAINT "FK_19fe8036263238b4fb3866243bf"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_item" DROP CONSTRAINT "FK_5e17c017aa3f5164cb2da5b1c6b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_item" DROP CONSTRAINT "FK_e9674a6053adbaa1057848cddfa"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_item" DROP CONSTRAINT "FK_4f22693817205af9eb18672c473"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_modifier" DROP CONSTRAINT "FK_d2bb79aa24d24bfaa21687de8c6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "selected_pizza_customization" DROP CONSTRAINT "FK_506bfd144314f3a36669d4366a8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "selected_pizza_customization" DROP CONSTRAINT "FK_af0507c028ab56aa1857150fb3c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" DROP CONSTRAINT "FK_772d0ce0473ac2ccfa26060dbe9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" DROP CONSTRAINT "FK_3d36410e89a795172fa6e0dd968"`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" DROP CONSTRAINT "FK_a922b820eeef29ac1c6800e826a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" DROP CONSTRAINT "FK_a47d559598368bc78800dd5175b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_preparation_screen_status" DROP CONSTRAINT "FK_e5e6be61e60a72ae6a37d51f08d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_preparation_screen_status" DROP CONSTRAINT "FK_e863dab712b10b8b468bde6baf1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_preparation_screen_status" DROP CONSTRAINT "FK_1d8a43c801b71b1513311f1ed2e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_preparation_screen_status" DROP CONSTRAINT "FK_032eb00af16911d930cd78964b9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "delivery_info" DROP CONSTRAINT "FK_2af51779cec2b29aa564e8547b5"`,
    );
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
      `ALTER TABLE "ticket_impression" DROP CONSTRAINT "FK_a606de7eac1188f69862ed98974"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ticket_impression" DROP CONSTRAINT "FK_bdcc1d40a49fed2ee030cc0aac5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ticket_impression" DROP CONSTRAINT "FK_39045644ff19bb02fc961bb482f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment" DROP CONSTRAINT "FK_f5221735ace059250daac9d9803"`,
    );
    await queryRunner.query(
      `ALTER TABLE "shift" DROP CONSTRAINT "FK_9213f00f25e73a46f8939951508"`,
    );
    await queryRunner.query(
      `ALTER TABLE "shift" DROP CONSTRAINT "FK_5f6b7929ee1eab2ac3429c31572"`,
    );
    await queryRunner.query(
      `ALTER TABLE "address" DROP CONSTRAINT "FK_9c9614b2f9d01665800ea8dbff7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "table" DROP CONSTRAINT "FK_65407279bef3b9e1458bb4ac588"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subcategory" DROP CONSTRAINT "FK_23584d8b8d26287e4fca0e1aaab"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subcategory" DROP CONSTRAINT "FK_b36496504b71c57762246db74d7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "category" DROP CONSTRAINT "FK_0b23b34cf4f29fdcac4a65d9b62"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a370300f78f7d36da3e12bc61b"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_36cfc9221deb83153bdc348908"`,
    );
    await queryRunner.query(`DROP TABLE "product_pizza_customization"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_5b42ef2ec32ad54c8df5de8833"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e35ee74f60bf7607fcfa5b5a44"`,
    );
    await queryRunner.query(`DROP TABLE "product_modifier_group"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ab1f24d4d8899260a7f3a220a7"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_174da1d397a53ad90de24113aa"`,
    );
    await queryRunner.query(`DROP TABLE "order_item_product_modifiers"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a2937c330238ea84f26c912104"`,
    );
    await queryRunner.query(`DROP TABLE "order_history"`);
    await queryRunner.query(`DROP TABLE "restaurant_config"`);
    await queryRunner.query(`DROP TABLE "business_hours"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3d2f174ef04fb312fdebd0ddc5"`,
    );
    await queryRunner.query(`DROP TABLE "session"`);
    await queryRunner.query(`DROP TABLE "sync_activity"`);
    await queryRunner.query(`DROP TYPE "public"."sync_activity_type_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f0e1b4ecdca13b177e2e3a0613"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_58e4dbff0e1a32a9bdc861bb29"`,
    );
    await queryRunner.query(`DROP TABLE "user"`);
    await queryRunner.query(`DROP TYPE "public"."user_gender_enum"`);
    await queryRunner.query(`DROP TABLE "preparation_screens"`);
    await queryRunner.query(`DROP TABLE "product"`);
    await queryRunner.query(`DROP TABLE "pizza_configuration"`);
    await queryRunner.query(`DROP TABLE "product_variant"`);
    await queryRunner.query(`DROP TABLE "order_item"`);
    await queryRunner.query(
      `DROP TYPE "public"."order_item_preparationstatus_enum"`,
    );
    await queryRunner.query(`DROP TABLE "product_modifier"`);
    await queryRunner.query(`DROP TABLE "modifier_group"`);
    await queryRunner.query(`DROP TABLE "selected_pizza_customization"`);
    await queryRunner.query(
      `DROP TYPE "public"."selected_pizza_customization_action_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."selected_pizza_customization_half_enum"`,
    );
    await queryRunner.query(`DROP TABLE "pizza_customization"`);
    await queryRunner.query(
      `DROP TYPE "public"."pizza_customization_type_enum"`,
    );
    await queryRunner.query(`DROP TABLE "orders"`);
    await queryRunner.query(`DROP TYPE "public"."orders_ordertype_enum"`);
    await queryRunner.query(`DROP TYPE "public"."orders_orderstatus_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_9ed77bea90710afe76a90f6202"`,
    );
    await queryRunner.query(`DROP TABLE "order_preparation_screen_status"`);
    await queryRunner.query(
      `DROP TYPE "public"."order_preparation_screen_status_status_enum"`,
    );
    await queryRunner.query(`DROP TABLE "delivery_info"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4a0fb0ce34a62a1d1536355589"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b860d19aac2598cd33a2d77143"`,
    );
    await queryRunner.query(`DROP TABLE "adjustment"`);
    await queryRunner.query(`DROP TABLE "ticket_impression"`);
    await queryRunner.query(
      `DROP TYPE "public"."ticket_impression_tickettype_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7f20d400228dc58a946e3b4ecb"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_cd20a8ea69e128597672d5c781"`,
    );
    await queryRunner.query(`DROP TABLE "thermal_printer"`);
    await queryRunner.query(
      `DROP TYPE "public"."thermal_printer_connectiontype_enum"`,
    );
    await queryRunner.query(`DROP TABLE "payment"`);
    await queryRunner.query(`DROP TYPE "public"."payment_paymentstatus_enum"`);
    await queryRunner.query(`DROP TYPE "public"."payment_paymentmethod_enum"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_shift_date"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_shift_status"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_shift_date_shift_number"`,
    );
    await queryRunner.query(`DROP TABLE "shift"`);
    await queryRunner.query(`DROP TYPE "public"."shift_status_enum"`);
    await queryRunner.query(`DROP INDEX "public"."uq_customer_email"`);
    await queryRunner.query(`DROP INDEX "public"."uq_customer_whatsapp"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2b5187e7475dcc88f25bec3967"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2af7646e11a0872eb9a0212545"`,
    );
    await queryRunner.query(`DROP TABLE "customer"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_49bc1e3cd91c06dc434318abd9"`,
    );
    await queryRunner.query(`DROP TABLE "address"`);
    await queryRunner.query(`DROP TABLE "table"`);
    await queryRunner.query(`DROP TABLE "area"`);
    await queryRunner.query(`DROP TABLE "subcategory"`);
    await queryRunner.query(`DROP TABLE "category"`);
    await queryRunner.query(`DROP TABLE "file"`);
    await queryRunner.query(`DROP TABLE "role"`);
  }
}
