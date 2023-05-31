/*
 * @Author       : 程哲林
 * @Date         : 2022-11-01 14:23:15
 * @LastEditors  : 程哲林
 * @LastEditTime : 2023-05-31 20:43:42
 * @FilePath     : /bilibili-downloader/src/app.controller.ts
 * @Description  : 未添加文件描述
 */
import { Controller, Get, Query, Post, Body } from '@nestjs/common';
import { AppService } from './app.service';
import { ConfQueryDto } from './app.dto/query.dto';
import { UpdateConfigDto } from './app.dto/update.dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('userinfo')
  userInfo() {
    return this.appService.getUserInfo();
  }

  /**
   * 获取基础配置
   * @returns 配置信息
   */
  @Get('config')
  findAll(@Query() query: ConfQueryDto) {
    return this.appService.getConfig(query);
  }

  /**
   * 获取登录二维码
   * @returns 二维码信息
   */
  @Get('qrcode')
  qrcode(): any {
    return this.appService.qrCodeGenerate();
  }

  @Get('poll')
  poll(@Query() { key }: any): any {
    return this.appService.loginPoll(key);
  }

  @Post('config')
  update(@Body() body: UpdateConfigDto): any {
    return this.appService.updateConfig(body);
  }
}
