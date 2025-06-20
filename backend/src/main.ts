import 'dotenv/config';
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
import { UniqueViolationFilter } from './common/filters/unique-violation.filter'; // Importar el nuevo filtro
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
    bodyParser: false, // Deshabilitamos el body parser por defecto para manejar uploads grandes
  });

  // Configurar body parser con límites más grandes
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Configurar timeout global del servidor
  const server = app.getHttpServer();
  server.setTimeout(300000); // 5 minutos de timeout
  server.keepAliveTimeout = 120000; // 2 minutos de keep-alive
  server.headersTimeout = 121000; // Ligeramente mayor que keepAliveTimeout

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

  // Obtener el servicio de contexto de usuario
  const userContextService = app.get(UserContextService);

  app.useGlobalInterceptors(
    new UserContextInterceptor(userContextService),
    new ResolvePromisesInterceptor(),
    new ClassSerializerInterceptor(app.get(Reflector)),
  );
  // Registrar UniqueViolationFilter PRIMERO
  app.useGlobalFilters(new UniqueViolationFilter());
  // Registrar AllExceptionsFilter DESPUÉS para capturar otros errores
  // Nota: AllExceptionsFilter podría necesitar el HttpAdapter, verificar su constructor.
  // Si AllExceptionsFilter no necesita argumentos, simplemente: new AllExceptionsFilter()
  // Si necesita HttpAdapter: app.useGlobalFilters(new AllExceptionsFilter(app.get(HttpAdapterHost)));
  // Asumiendo que no necesita argumentos por ahora, basado en el código original.
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

  // Obtener y mostrar las IPs disponibles
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

  console.log('\n🚀 Server is running!');
  console.log('📍 Local:    http://localhost:' + port);
  addresses.forEach((address) => {
    console.log(`📍 Network:  http://${address}:${port}`);
  });
  console.log('📚 Swagger:  http://localhost:' + port + '/docs\n');
}
void bootstrap();
