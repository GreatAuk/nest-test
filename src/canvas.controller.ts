import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import * as canvas from 'canvas';
import * as echarts from 'echarts';

@Controller('canvas')
export class CanvasController {
  /** 生成截图 */
  @Get('echarts')
  async screenshot(@Res() res: Response): Promise<any> {
    const ctx = canvas.createCanvas(800, 600);
    // @ts-ignore
    // 将 canvas 实例设置为 echarts 容器
    echarts.setCanvasCreator(() => ctx);
    // @ts-ignore
    const chart = echarts.init(ctx);
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
    chart.setOption(options);
    res.attachment('echart.png');
    // @ts-ignore
    res.send(chart.getDom().toBuffer());
  }
}
