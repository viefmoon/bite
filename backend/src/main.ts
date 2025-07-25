import 'dotenv/config';

process.env.TZ = 'UTC';
import {
  ClassSerializerInterceptor,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { useContainer } from 'class-validator';
import { AppModule } from './app.module';
import validationOptions from './utils/validation-options';
import { AllConfigType } from './config/config.type';
import { ResolvePromisesInterceptor } from './utils/serializer.interceptor';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { UniqueViolationFilter } from './common/filters/unique-violation.filter';
import { UserContextInterceptor } from './common/interceptors/user-context.interceptor';
import { UserContextService } from './common/services/user-context.service';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: {
      origin: true,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control'],
    },
    bodyParser: false,
  });

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  const server = app.getHttpServer();
  server.setTimeout(300000);
  server.keepAliveTimeout = 120000;
  server.headersTimeout = 121000;

  useContainer(app.select(AppModule), { fallbackOnErrors: true });
  const configService = app.get(ConfigService<AllConfigType>);

  app.enableShutdownHooks();
  app.setGlobalPrefix(
    configService.getOrThrow('app.apiPrefix', { infer: true }),
    {
      exclude: ['/'],
    },
  );
  app.enableVersioning({
    type: VersioningType.URI,
  });
  app.useGlobalPipes(new ValidationPipe(validationOptions));

  const userContextService = app.get(UserContextService);

  app.useGlobalInterceptors(
    new UserContextInterceptor(userContextService),
    new ResolvePromisesInterceptor(),
    new ClassSerializerInterceptor(app.get(Reflector)),
  );
  app.useGlobalFilters(new UniqueViolationFilter());
  app.useGlobalFilters(new AllExceptionsFilter());

  const options = new DocumentBuilder()
    .setTitle('API')
    .setDescription('API docs')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('docs', app, document);

  const port = configService.getOrThrow('app.port', { infer: true });
  await app.listen(port, '0.0.0.0');

  const os = await import('os');
  const networkInterfaces = os.networkInterfaces();
  const addresses: string[] = [];

  for (const interfaces of Object.values(networkInterfaces)) {
    for (const iface of interfaces || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push(iface.address);
      }
    }
  }
}
void bootstrap();
