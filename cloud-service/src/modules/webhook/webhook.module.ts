import { Module } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';
import { WhatsappService } from './whatsapp.service';
import { AiModule } from '../ai/ai.module';
import { SyncModule } from '../sync/sync.module';

@Module({
  imports: [
    AiModule,
    SyncModule,
  ],
  controllers: [WebhookController],
  providers: [WebhookService, WhatsappService],
  exports: [WebhookService, WhatsappService],
})
export class WebhookModule {}