import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { AudioOrderProcessingController } from './controllers/audio-order-processing.controller';
import { AudioOrderProcessingService } from './services/audio-order-processing.service';
import audioOrderConfig from './config/audio-order.config';

@Module({
  imports: [
    ConfigModule.forFeature(audioOrderConfig),
    HttpModule.register({
      timeout: 300000,
      maxRedirects: 5,
    }),
  ],
  controllers: [AudioOrderProcessingController],
  providers: [AudioOrderProcessingService],
  exports: [AudioOrderProcessingService],
})
export class AudioOrderProcessingModule {}
