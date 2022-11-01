/*
 * @Author       : 程哲林
 * @Date         : 2022-11-01 14:23:15
 * @LastEditors  : 程哲林
 * @LastEditTime : 2022-11-01 19:41:09
 * @FilePath     : /bilibili-downloader/src/app.module.ts
 * @Description  : 未添加文件描述
 */

import { Module, Logger } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { WatchModule } from './watch/watch.module';
import { DownloadModule } from './download/download.module';
import { join } from 'path';
import { HttpModule, HttpService } from '@nestjs/axios';
import { AxiosRequestConfig } from 'axios';
import { readCookie, login } from './utils';

@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
      headers: {
        Accept: '*/*',
        referer: 'https://t.bilibili.com/',
        Connection: 'keep-alive',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.114 Safari/537.36',
      },
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'client'),
      exclude: ['/api*'],
      serveStaticOptions: {
        etag: true,
      },
    }),
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    WatchModule,
    DownloadModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  constructor(private readonly httpService: HttpService) {}
  private readonly logger = new Logger(AppModule.name);

  onModuleInit() {
    const axios = this.httpService.axiosRef;
    axios.interceptors.request.use((config: AxiosRequestConfig) => {
      this.logger.log(`接口请求：${config.url}`);
      config.headers.cookie = readCookie();
      return config;
    });
  }

  async onApplicationBootstrap(): Promise<void> {
    await login();
  }
}
