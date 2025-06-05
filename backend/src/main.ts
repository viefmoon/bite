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

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
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
  app.useGlobalInterceptors(
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
