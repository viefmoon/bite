import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configuración global
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
  }));

  // Configurar middlewares para manejar webhooks
  app.use(json({ 
    limit: '10mb',
    verify: (req: any, res, buf) => {
      req.rawBody = buf.toString('utf-8');
    }
  }));
  app.use(urlencoded({ extended: true, limit: '10mb' }));

  // CORS
  app.enableCors({
    origin: process.env.FRONTEND_BASE_URL || 'http://localhost:3000',
    credentials: true,
  });

  const port = process.env.PORT || 5000;
  await app.listen(port);
  console.log(`Cloud service running on port ${port}`);
}
bootstrap();