import { Controller, Get, Post, Req, Res, Query } from '@nestjs/common';
import { Request, Response } from 'express';
import { WebhookService } from './webhook.service';

@Controller('webhook')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Get()
  async verify(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response,
  ) {
    if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
      console.log('Webhook verified');
      res.status(200).send(challenge);
    } else {
      console.error('Webhook verification failed');
      res.status(403).send('Forbidden');
    }
  }

  @Post()
  async handleWebhook(@Req() req: Request, @Res() res: Response) {
    try {
      // Responder inmediatamente a WhatsApp
      res.status(200).send('OK');
      
      // Procesar el webhook de forma asíncrona
      this.webhookService.processWebhook(req.body).catch(error => {
        console.error('Error processing webhook:', error);
      });
    } catch (error) {
      console.error('Error in webhook handler:', error);
      res.status(500).send('Internal Server Error');
    }
  }
}