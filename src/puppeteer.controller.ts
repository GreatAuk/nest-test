import { Controller, Get, Res } from '@nestjs/common'
import * as puppeteer from 'puppeteer'
import { Browser } from 'puppeteer'
import { Response } from 'express'

@Controller('puppeteer')
export class PuppeteerController {
  @Get('screenshot')
  async screenshot(@Res() res: Response): Promise<any> {
    let browser: Browser | undefined = undefined
    try {
      browser = await puppeteer.launch({
        args: ['--no-sandbox']
      })
      const page = await browser.newPage()
      await page.goto('https://www.baidu.com/')
      const buffer = await page.screenshot({
        // path: '1.png',
        fullPage: true
      })
      await browser.close()
      res.attachment('screenshot.png')
      res.send(buffer)
    } catch (err) {
      await browser?.close()
      console.error(err)
      return Promise.resolve('screenshot fail')
    }
  }
  @Get('pdf')
  async pdf(@Res() res: Response) {
    let browser: Browser | undefined = undefined
    try {
      browser = await puppeteer.launch({
        args: ['--no-sandbox']
      })
      const page = await browser.newPage()
      // 一般 PDF 用于打印，所以默认以 print 媒体查询 （media query）的样式来截取。这里调用 page.emulateMedia("screen") 显式指定环境为 screen 而不是 print 是为了得到更加接近于页面在浏览器中展示的效果。
      await page.emulateMediaType('screen')
      await page.goto('https://docs.nestjs.cn/6/controllers')
      const buffer = await page.pdf({
        // path: 'baidu.pdf',
        format: 'A4',
        // 如果页面中使用了背景图片，截取出来是看不到的,所以需求加入 printBackground: true
        printBackground: true
      })
      await browser.close()
      res.attachment('baidu.pdf')
      res.send(buffer)
    } catch(err) {
      console.error(err)
      browser?.close()
      res.send('create pdf fail')
    }
  }
}

type b = null extends number ? true : false