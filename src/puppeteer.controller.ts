import { Controller, Get, Res } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import { Browser } from 'puppeteer';
import { Response } from 'express';

@Controller('puppeteer')
export class PuppeteerController {
  /** 生成截图 */
  @Get('screenshot')
  async screenshot(@Res() res: Response): Promise<any> {
    let browser: Browser | undefined = undefined;
    try {
      browser = await puppeteer.launch({
        args: ['--no-sandbox'],
      });
      const page = await browser.newPage();
      await page.goto('https://www.baidu.com/');
      const buffer = await page.screenshot({
        // path: '1.png',
        type: 'png',
        fullPage: true,
      });
      await browser.close();
      res.attachment('screenshot.png');
      res.send(buffer);
    } catch (err) {
      await browser?.close();
      console.error(err);
      return Promise.resolve('screenshot fail');
    }
  }

  /** 生成 dpf */
  @Get('pdf')
  async pdf(@Res() res: Response) {
    let browser: Browser | undefined = undefined;
    try {
      browser = await puppeteer.launch({
        args: ['--no-sandbox'],
      });
      const page = await browser.newPage();
      // 一般 PDF 用于打印，所以默认以 print 媒体查询 （media query）的样式来截取。这里调用 page.emulateMedia("screen") 显式指定环境为 screen 而不是 print 是为了得到更加接近于页面在浏览器中展示的效果。
      await page.emulateMediaType('screen');
      await page.goto('https://docs.nestjs.cn/6/controllers');
      const buffer = await page.pdf({
        // path: 'baidu.pdf',
        format: 'A4',
        // 如果页面中使用了背景图片，截取出来是看不到的,所以需求加入 printBackground: true
        printBackground: true,
      });
      await browser.close();
      res.attachment('baidu.pdf');
      res.send(buffer);
    } catch (err) {
      console.error(err);
      browser?.close();
      res.send('create pdf fail');
    }
  }
  /** 生成 echart 图表 */
  @Get('echart')
  async echart(@Res() res: Response) {
    let browser: Browser | undefined = undefined;
    try {
      browser = await puppeteer.launch({
        args: ['--no-sandbox'],
      });
      const page = await browser?.newPage();
      // 设置page内容
      const containerElement =
        '<div id="container" style="width: 1200px;height:800px;"></div>';
      const content = `<!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="X-UA-Compatible" content="ie=edge">
          <title>chart</title>
        </head>
        <body>
          ${containerElement}
        </body>
        </html>
      `;
      // 设置 page 内容
      await page.setContent(content);
      // 演讲稿 echarts 到页面
      await page.addScriptTag({
        url: 'https://cdn.bootcdn.net/ajax/libs/echarts/5.0.1/echarts.min.js',
      });

      // 指定图表的配置项和数据
      const options = {
        title: {
          text: 'ECharts 入门示例',
        },
        tooltip: {},
        legend: {
          data: ['销量'],
        },
        xAxis: {
          data: ['衬衫', '羊毛衫', '雪纺衫', '裤子', '高跟鞋', '袜子'],
        },
        yAxis: {},
        series: [
          {
            name: '销量',
            type: 'bar',
            data: [115, 220, 136, 100, 130, 260],
          },
        ],
      };
      // 传递options对象到evaluate函数中，挂载到window对象的全局属性中
      await page.evaluate((options) => {
        window._chart = {
          options,
        };
      }, options);
      // echarts 初始化脚本注入页面
      await page.addScriptTag({
        content: `
        (function (window) {
            let option =window._chart.options;
            var myChart = window.echarts.init(document.getElementById('container'));
            myChart.setOption(option);
        })(this);`,
      });
      await page.waitForTimeout(1000); // 停留一秒，否则有可能图表还没渲染完就截图
      const $el = await page.waitForSelector('#container');
      const buffer = await $el.screenshot({ type: 'png' }); //开始截图
      await browser.close();

      res.attachment('screenshot.png');
      res.send(buffer);
    } catch (err) {
      console.error(err);
      browser?.close();
    }
  }
}
