import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { FilesModule } from './files/files.module';
import { AuthModule } from './auth/auth.module';
import databaseConfig from './database/config/database.config';
import authConfig from './auth/config/auth.config';
import appConfig from './config/app.config';
import mailConfig from './mail/config/mail.config';
import fileConfig from './files/config/file.config';
import syncConfig from './sync/config/sync.config';
import audioOrderConfig from './audio-order-processing/config/audio-order.config';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmConfigService } from './database/typeorm-config.service';
import { MailModule } from './mail/mail.module';
import { HomeModule } from './home/home.module';
import { DataSource, DataSourceOptions } from 'typeorm';
import { SessionModule } from './session/session.module';
import { MailerModule } from './mailer/mailer.module';
import { AreasModule } from './areas/areas.module';
import { TablesModule } from './tables/tables.module';
import { CategoriesModule } from './categories/categories.module';
import { SubcategoriesModule } from './subcategories/subcategories.module';
import { ProductsModule } from './products/products.module';
import { ProductVariantsModule } from './product-variants/product-variants.module';
import { ModifierGroupsModule } from './modifier-groups/modifier-groups.module';
import { ProductModifiersModule } from './product-modifiers/product-modifiers.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { ThermalPrintersModule } from './thermal-printers/thermal-printers.module';
import { CustomersModule } from './customers/customers.module';
import { PreparationScreensModule } from './preparation-screens/preparation-screens.module';
import { CommonModule } from './common/common.module';
import { AvailabilityModule } from './availability/availability.module';
import { AdjustmentsModule } from './adjustments/adjustments.module';
import { RestaurantConfigModule } from './restaurant-config/restaurant-config.module';
import { PizzaCustomizationsModule } from './pizza-customizations/pizza-customizations.module';
import { PizzaConfigurationsModule } from './pizza-configurations/pizza-configurations.module';
import { SyncModule } from './sync/sync.module';
import { AudioOrderProcessingModule } from './audio-order-processing/audio-order-processing.module';
import { DiscoveryModule } from './discovery/discovery.module';
import { KitchenModule } from './kitchen/kitchen.module';
import { HealthModule } from './health/health.module';
import { ShiftsModule } from './shifts/shifts.module';

const infrastructureDatabaseModule = TypeOrmModule.forRootAsync({
  useClass: TypeOrmConfigService,
  dataSourceFactory: async (options: DataSourceOptions) => {
    return new DataSource(options).initialize();
  },
});

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        databaseConfig,
        authConfig,
        appConfig,
        mailConfig,
        fileConfig,
        syncConfig,
        audioOrderConfig,
      ],
      envFilePath: ['.env'],
    }),
    infrastructureDatabaseModule,
    CommonModule, // Debe estar primero porque es Global
    UsersModule,
    FilesModule,
    AuthModule,
    SessionModule,
    MailModule,
    MailerModule,
    HomeModule,
    AreasModule,
    TablesModule,
    CategoriesModule,
    SubcategoriesModule,
    ProductsModule,
    ProductVariantsModule,
    ModifierGroupsModule,
    ProductModifiersModule,
    OrdersModule,
    PaymentsModule,
    ThermalPrintersModule,
    CustomersModule,
    PreparationScreensModule,
    AvailabilityModule,
    AdjustmentsModule,
    RestaurantConfigModule,
    PizzaCustomizationsModule,
    PizzaConfigurationsModule,
    SyncModule,
    AudioOrderProcessingModule,
    DiscoveryModule,
    KitchenModule,
    HealthModule,
    ShiftsModule,
  ],
})
export class AppModule {}
