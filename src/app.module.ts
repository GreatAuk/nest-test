import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { PuppeteerController } from './puppeteer.controller';
import { CanvasController } from './canvas.controller';
import { AppService } from './app.service';

@Module({
  imports: [],
  controllers: [AppController, PuppeteerController, CanvasController],
  providers: [AppService],
})
export class AppModule {}
