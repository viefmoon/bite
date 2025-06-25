import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { SyncLogEntity } from './infrastructure/persistence/relational/entities/sync-log.entity';
import { LocalSyncService } from './services/local-sync.service';
import { SyncStatusService } from './services/sync-status.service';
import { SyncController } from './controllers/sync.controller';
import { RelationalSyncLogRepository } from './infrastructure/persistence/relational/repositories/sync-log.repository';
import syncConfig from './config/sync.config';
import { OrdersModule } from '../orders/orders.module';
import { CustomersModule } from '../customers/customers.module';
import { CategoriesModule } from '../categories/categories.module';
import { ProductsModule } from '../products/products.module';
import { RestaurantConfigModule } from '../restaurant-config/restaurant-config.module';

const providers = [
  LocalSyncService,
  SyncStatusService,
  {
    provide: 'SYNC_LOG_REPOSITORY',
    useClass: RelationalSyncLogRepository,
  },
];

@Module({
  imports: [
    ConfigModule.forFeature(syncConfig),
    TypeOrmModule.forFeature([SyncLogEntity]),
    HttpModule,
    OrdersModule,
    CustomersModule,
    CategoriesModule,
    ProductsModule,
    RestaurantConfigModule,
  ],
  controllers: [SyncController],
  providers,
  exports: [LocalSyncService, SyncStatusService],
})
export class SyncModule {}
