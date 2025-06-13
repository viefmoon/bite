import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { WebhookModule } from './modules/webhook/webhook.module';
import { SyncModule } from './modules/sync/sync.module';
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
          throw new Error('DATABASE_URL must be provided');
        }
        
        return {
          type: 'postgres',
          url: databaseUrl,
          autoLoadEntities: false, // No cargar entidades automáticamente
          synchronize: false, // Nunca sincronizar, usamos la BD clonada
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
    SyncModule,
    AiModule,
  ],
})
export class AppModule {}