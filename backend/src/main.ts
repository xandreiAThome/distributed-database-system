import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe, Logger } from '@nestjs/common';
import * as express from 'express';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Log all environment variables at startup
  logger.log('=== ENVIRONMENT VARIABLES AT STARTUP ===');
  logger.log('NODE_NAME:', process.env.NODE_NAME);
  logger.log('NODE_ROLE:', process.env.NODE_ROLE);
  logger.log('CENTRAL_URL:', process.env.CENTRAL_URL);
  logger.log('NODE2_URL:', process.env.NODE2_URL);
  logger.log('NODE3_URL:', process.env.NODE3_URL);
  logger.log('EVEN_NODE:', process.env.EVEN_NODE);
  logger.log('ODD_NODE:', process.env.ODD_NODE);
  logger.log(
    'DATABASE_URL:',
    process.env.DATABASE_URL ? '***SET***' : '***NOT SET***',
  );
  logger.log('PORT:', process.env.PORT);
  logger.log('=== ALL ENV KEYS ===');
  const relevantKeys = Object.keys(process.env).filter(
    (k) =>
      k.includes('NODE') ||
      k.includes('CENTRAL') ||
      k.includes('DATABASE') ||
      k.includes('EVEN') ||
      k.includes('ODD') ||
      k.includes('PORT'),
  );
  logger.log('Relevant env vars:', relevantKeys);
  relevantKeys.forEach((key) => {
    logger.log(`  ${key}:`, process.env[key]);
  });
  logger.log('=====================================');

  const app = await NestFactory.create(AppModule);

  // Increase request body size limit
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  app.enableCors();

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Setup Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Distributed Database API Docs')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, documentFactory);

  const port = process.env.PORT ?? 3000;
  const nodeRole = process.env.NODE_ROLE ?? 'standalone';

  app.enableCors();
  await app.listen(port);
  logger.log(`Application started on port ${port} (Role: ${nodeRole})`);
}
void bootstrap();
