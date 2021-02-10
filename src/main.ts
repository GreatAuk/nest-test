import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

const Port = process.env.NODE_ENV === 'development' ? 8100 : 8200

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(Port);
}
bootstrap();
