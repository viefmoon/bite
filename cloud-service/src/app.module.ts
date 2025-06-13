import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { WebhookModule } from './modules/webhook/webhook.module';
import { OrdersModule } from './modules/orders/orders.module';
import { CustomersModule } from './modules/customers/customers.module';
import { SyncModule } from './modules/sync/sync.module';
import { OtpModule } from './modules/otp/otp.module';
import { AiModule } from './modules/ai/ai.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      useFactory: () => {
        const databaseUrl = process.env.DATABASE_URL;
        
        if (!databaseUrl) {
          console.warn('DATABASE_URL not provided, using in-memory SQLite database');
          return {
            type: 'sqlite',
            database: ':memory:',
            autoLoadEntities: true,
            synchronize: true,
            logging: false,
          };
        }
        
        return {
          type: 'postgres',
          url: databaseUrl,
          autoLoadEntities: true,
          synchronize: process.env.NODE_ENV !== 'production',
          logging: process.env.NODE_ENV === 'development',
          ssl: process.env.NODE_ENV === 'production' ? {
            rejectUnauthorized: false
          } : false,
          extra: {
            max: 10,
            connectionTimeoutMillis: 10000,
          },
        };
      },
    }),
    WebhookModule,
    OrdersModule,
    CustomersModule,
    SyncModule,
    OtpModule,
    AiModule,
  ],
})
export class AppModule {}