import { Controller, Get, Res, Query } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import { Browser } from 'puppeteer';
import { Response } from 'express';
import * as dayjs from 'dayjs';

type Crawler1Query =
  | {
      /** 开始时间，默认是昨天 */
      startDate: string;
      /** 结束时间，默认是昨天 */
      endDate: string;
    }
  | {
      /** 开始时间，默认是昨天 */
      startDate: undefined;
      /** 结束时间，默认是昨天 */
      endDate: undefined;
    };

@Controller('puppeteer')
export class PuppeteerController {
  /** 生成截图 /puppeteer/screehshot */
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

  /** 生成 dpf /puppeteer/pdf */
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
      await page.goto('https://docs.nestjs.cn/6/controllers', {
        waitUntil: 'networkidle0',
      });
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
  /** 生成 echart 图表 /puppeteer/echart */
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

  /** /puppeteer/crawler1 */
  @Get('crawler1')
  async crawler1(@Res() res: Response, @Query() query: Crawler1Query) {
    /** 昨天 */
    const lastDay: string = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
    const { startDate = lastDay, endDate = lastDay } = query;
    let browser: Browser | undefined = undefined;
    try {
      browser = await puppeteer.launch({
        args: ['--no-sandbox'],
        headless: true,
        defaultViewport: {
          width: 1980,
          height: 1080,
        },
      });
      const page = await browser.newPage();
      await page.goto('http://www.cnyiot.com/Mlogin.aspx');
      await page.type('#username', '999999');
      await page.type('#password', '123456');
      await Promise.all([page.click('#subBt'), page.waitForNavigation()]);
      await page.waitForSelector('#lineIc');
      await page.$eval('#lineIc', (element) => {
        // @ts-ignore
        return element.click();
      });
      await page.waitForTimeout(2000);
      // 显示电表设备下拉框
      await page.click('.bs-placeholder.dropdown-toggle');
      const ammeterIds: string[] = await page.evaluate(() => {
        const ids: string[] = [];
        const items = document.querySelectorAll('#bs-select-1 li .text');
        items.forEach((item) => {
          const innerText = item.innerHTML;
          ids.push(innerText.split(' : ')[0]);
        });
        return ids;
      });

      // 选中水表类型
      await page.select('#metType', '1');
      // 显示水表设备下拉框
      await page.click('.bs-placeholder.dropdown-toggle');
      const waterAmmeterIds: string[] = await page.evaluate(() => {
        const ids: string[] = [];
        const items = document.querySelectorAll('#bs-select-1 li .text');
        items.forEach((item) => {
          const innerText = item.innerHTML;
          ids.push(innerText.split(' : ')[0]);
        });
        return ids;
      });
      await page.evaluate(
        ({ startDate, endDate, deviceIds }) => {
          fetch('http://www.cnyiot.com/MOnLineRecord.aspx?Method=getTable', {
            headers: {
              accept: 'application/json, text/javascript, */*; q=0.01',
              'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8,ja;q=0.7',
              'content-type': 'application/x-www-form-urlencoded',
              'x-requested-with': 'XMLHttpRequest',
            },
            referrer: 'http://www.cnyiot.com/MOnLineRecord.aspx',
            referrerPolicy: 'strict-origin-when-cross-origin',
            body: `st=${startDate}&et=${endDate}&metID=${deviceIds.join(
              ',',
            )}&mYMD=2`,
            method: 'POST',
            mode: 'cors',
            credentials: 'include',
          });
        },
        {
          startDate,
          endDate,
          deviceIds: ammeterIds,
        },
      );
      await page.evaluate(
        ({ startDate, endDate, deviceIds }) => {
          fetch('http://www.cnyiot.com/MOnLineRecord.aspx?Method=getTable', {
            headers: {
              accept: 'application/json, text/javascript, */*; q=0.01',
              'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8,ja;q=0.7',
              'content-type': 'application/x-www-form-urlencoded',
              'x-requested-with': 'XMLHttpRequest',
            },
            referrer: 'http://www.cnyiot.com/MOnLineRecord.aspx',
            referrerPolicy: 'strict-origin-when-cross-origin',
            body: `st=${startDate}&et=${endDate}&metID=${deviceIds.join(
              ',',
            )}&mYMD=2`,
            method: 'POST',
            mode: 'cors',
            credentials: 'include',
          });
        },
        {
          startDate,
          endDate,
          deviceIds: waterAmmeterIds,
        },
      );

      const responses: any[] = [];
      for (let i = 0; i < 2; i++) {
        const finalResponse = await page.waitForResponse((response) => {
          return (
            response.url() ===
            'http://www.cnyiot.com/MOnLineRecord.aspx?Method=getTable'
          );
        });
        responses.push(await finalResponse.json());
      }
      const result: any = {
        result: 'ok',
        val: [],
      };
      responses?.forEach((res) => {
        result.val.push(...res.val);
      });
      res.send(result);
      page.close();
      browser.close();
    } catch (error) {
      console.error(error);
      browser?.close();
    }
  }

  /** /puppeteer/crawler2 */
  @Get('crawler2')
  async crawler2(@Res() res: Response) {
    let browser: Browser | undefined = undefined;
    try {
      browser = await puppeteer.launch({
        args: ['--no-sandbox'],
      });

      const page = await browser?.newPage();
      // 一般 PDF 用于打印，所以默认以 print 媒体查询 （media query）的样式来截取。这里调用 page.emulateMedia("screen") 显式指定环境为 screen 而不是 print 是为了得到更加接近于页面在浏览器中展示的效果。
      await page.emulateMediaType('screen');
      await page.goto(
        'http://47.111.119.145:8081/#/?ReportId=11&ReportStrategyId=7&isDownload=1&isEdit=1&token=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiIxMjM0MzIxIiwiaWF0IjoxNjE1OTQ4OTE5LjAsImV4cCI6MTYxNjIwODExOS4wLCJqdGkiOiJTaW5vY29sZCIsIlVzZXJJZCI6MTIwLCJVc2VyTmFtZSI6InBsdXMxcyIsIk5pY2tOYW1lIjoi6JKL6LS76ZGrIn0.xEs4zjeMXfJzgeU2MRg7e33vBfpHtAUS6kxjofBa6Ik',
        {
          waitUntil: 'networkidle0',
        },
      );

      const footerInnerText = await page.$eval(
        '#footer-template-JKDFKDJS2387423',
        (el) => el.innerHTML,
      );
      const buffer = await page.pdf({
        // path: 'baidu.pdf',
        format: 'A4',
        // 如果页面中使用了背景图片，截取出来是看不到的,所以需求加入 printBackground: true
        printBackground: true,
        displayHeaderFooter: true,
        margin: {
          top: 90,
          bottom: 80,
        },
        headerTemplate: `
        <div style="width: 100%;-webkit-print-color-adjust: exact;">
      <div
        style="width: 100%;display: flex;justify-content: space-between;align-items: center;box-sizing: border-box;padding: 0 20px 0px 20px;"
      >
        <h1
          style="font-size: 20px;font-weight: bold;font-family: SourceHanSansSC-Light;margin:0"
        >
          门店设备管理报告
        </h1>
        <img
          src="data:image/png;base64,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"
          style="height: 25px;"
          alt=""
        />
      </div>
      <div
        style="height: 1px;margin: 10px 20px 0 20px;box-sizing: border-box;background-color: #F1F3F4;-webkit-print-color-adjust: exact;"
      ></div>
    </div>
        `,
        footerTemplate: `
          <div
            style="width: 100%;-webkit-print-color-adjust: exact;font-family: SourceHanSansSC-Light;"
          >
            <div
              style="width: 100%;display: flex;justify-content: space-between;align-items: center;box-sizing: border-box;padding: 0 20px 0px 20px;"
            >
              <div style="font-size: 12px;margin:0;color: #808080;">
                ${footerInnerText}
              </div>
              <div style="color: #808080;font-size: 12px;">
                <span class="pageNumber"></span>/<span class="totalPages"></span>
              </div>
            </div>
          </div>
        `,
      });
      await browser.close();
      res.attachment('test.pdf');
      res.send(buffer);
    } catch (err) {
      console.error(err);
      res.send({
        code: 500,
        message: err,
      });
      console.error(err);
      browser?.close();
    }
  }

  /** 爬图片 */
  @Get('crawlerImg')
  async crawlerImg(@Res() res: Response) {
    let browser: Browser | undefined = undefined;
    try {
      browser = await puppeteer.launch({
        args: ['--no-sandbox'],
      });
      const page = await browser.newPage();
      // 一般 PDF 用于打印，所以默认以 print 媒体查询 （media query）的样式来截取。这里调用 page.emulateMedia("screen") 显式指定环境为 screen 而不是 print 是为了得到更加接近于页面在浏览器中展示的效果。
      await page.emulateMediaType('screen');
      await page.goto('http://topology.le5le.com', {
        // waitUntil: 'networkidle0',
      });
      // await page.$$eval('.group .full', (spans) => {
      //   const groups = spans.filter((v) => v.innerHTML.includes('Iot'));
      //   groups.forEach((v) => {
      //     console.log('[333]-puppeteer.controller.ts', v.innerHTML);
      //   });
      // });
      await browser.close();
      res.send('yes');
      // res.attachment('baidu.pdf');
      // res.send(buffer);
    } catch (err) {
      console.error(err);
      browser?.close();
      res.send('create pdf fail');
    }
  }
}
