import { Controller, Get, Res, Query } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import { Browser } from 'puppeteer';
import { Response } from 'express';
const dayjs = require('dayjs')

type Crawler1Query = {
  /** 开始时间，默认是昨天 */
  startDate: string;
  /** 结束时间，默认是昨天 */
  endDate: string;
} | {
  /** 开始时间，默认是昨天 */
  startDate: undefined;
  /** 结束时间，默认是昨天 */
  endDate: undefined;
}

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
      console.log('[18]-puppeteer.controller.ts', 232323)
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

  @Get('crawler1')
  async crawler1(@Res() res: Response, @Query() query: Crawler1Query) {
    /** 昨天 */
    const lastDay: string = dayjs().subtract(1, 'day').format('YYYY-MM-DD')
    const { startDate = lastDay, endDate = lastDay } = query
    let browser: Browser | undefined = undefined
    try {
      browser = await puppeteer.launch({
        args: ['--no-sandbox'],
        defaultViewport: {
          width: 1980,
          height: 1080
        },
      });
      let page = await browser.newPage();
      page.setViewport
      await page.goto('http://www.cnyiot.com/Mlogin.aspx');
      await page.type('#username', '999999');
      await page.type('#password', '123456');
      await Promise.all([
        page.click('#subBt'),
        page.waitForNavigation(),
      ]);
      await page.waitForSelector('#lineIc');
      await page.$eval('#lineIc', (element) => {
      // @ts-ignore
        return element.click()
      })
      await page.waitForTimeout(2000)
      // 显示设备下拉框
      await page.click('.bs-placeholder');
      const deviceIds: string[] = await page.evaluate(() => {
        const ids: string[] = []
        const items = document.querySelectorAll('#bs-select-1 li .text')
        items.forEach(item => {
          const innerText = item.innerHTML
          ids.push(innerText.split(' : ')[0])
        })
        return ids
      })
      await page.evaluate(({ startDate, endDate, deviceIds }) => {
        fetch("http://www.cnyiot.com/MOnLineRecord.aspx?Method=getTable", {
          "headers": {
            "accept": "application/json, text/javascript, */*; q=0.01",
            "accept-language": "zh-CN,zh;q=0.9,en;q=0.8,ja;q=0.7",
            "content-type": "application/x-www-form-urlencoded",
            "x-requested-with": "XMLHttpRequest"
          },
          "referrer": "http://www.cnyiot.com/MOnLineRecord.aspx",
          "referrerPolicy": "strict-origin-when-cross-origin",
          "body": `st=${startDate}&et=${endDate}&metID=${deviceIds.join(',')}&mYMD=2`,
          "method": "POST",
          "mode": "cors",
          "credentials": "include"
        });
      }, { startDate, endDate, deviceIds })
      const finalResponse = await page.waitForResponse(response => response.url() === 'http://www.cnyiot.com/MOnLineRecord.aspx?Method=getTable');
      res.send(await finalResponse.json())
      page.close()
      browser.close()
    } catch (error) {
      console.error(error)
      browser?.close()
    }
  }
}
