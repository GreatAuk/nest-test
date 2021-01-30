import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { PuppeteerController } from './puppeteer.controller';
import { AppService } from './app.service';

@Module({
  imports: [],
  controllers: [AppController, PuppeteerController],
  providers: [AppService],
})
export class AppModule {}
