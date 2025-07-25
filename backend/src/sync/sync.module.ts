import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { LocalSyncService } from './services/local-sync.service';
import { SyncController } from './controllers/sync.controller';
import syncConfig from './config/sync.config';
import { CategoriesModule } from '../categories/categories.module';
import { RestaurantConfigModule } from '../restaurant-config/restaurant-config.module';

const providers = [LocalSyncService];

@Module({
  imports: [
    ConfigModule.forFeature(syncConfig),
    HttpModule,
    CategoriesModule,
    RestaurantConfigModule,
  ],
  controllers: [SyncController],
  providers,
  exports: [LocalSyncService],
})
export class SyncModule {}
