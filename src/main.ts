import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  app.enableCors({
    origin: true,
    credentials: true,
  });

  const port = process.env.PORT || 5002;
  await app.listen(port);
  logger.log(`MQ Monitor application is running on: http://localhost:${port}`);
}
bootstrap();