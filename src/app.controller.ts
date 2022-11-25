/*
 * @Author       : 程哲林
 * @Date         : 2022-11-01 14:23:15
 * @LastEditors  : 程哲林
 * @LastEditTime : 2022-11-25 11:11:24
 * @FilePath     : /bilibili-downloader/src/app.controller.ts
 * @Description  : 未添加文件描述
 */
import { Controller, Get, Query, Post, Body } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /**
   * 获取基础配置
   * @returns 配置信息
   */
  @Get('config')
  getConfig(): any {
    return this.appService.getConfig();
  }

  /**
   * 获取登录二维码
   * @returns 二维码信息
   */
  @Get('qrcode')
  qrCodeGenerate(): any {
    return this.appService.qrCodeGenerate();
  }

  @Get('poll')
  poll(@Query() { key }: any): any {
    return this.appService.loginPoll(key);
  }

  @Post('edit')
  edit(@Body() body: any): any {
    return this.appService.saveConfig(body);
  }
}
