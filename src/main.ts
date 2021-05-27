import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

const Port = 8200;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(Port);
}
bootstrap();
