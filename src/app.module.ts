/*
 * @Author       : 程哲林
 * @Date         : 2022-11-01 14:23:15
 * @LastEditors  : 程哲林
 * @LastEditTime : 2022-11-01 18:23:59
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
import { readCookie, login, writeJsonFile } from './utils';

import * as qrcode from 'qrcode-terminal';
import { loginStatus, userInfo } from './services/login';

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
    const qc = await login();

    if (qc?.is_login === false) {
      qrcode.generate(qc.url, { small: true });
      this.logger.log(`⬆️⬆️⬆️ 请扫码二维码登陆 ⬆️⬆️⬆️`);

      const timer = setInterval(async () => {
        const res = await loginStatus(qc.qrcode_key);
        const { code, refresh_token, message } = res.data.data;
        if ([0, 86038].includes(code)) {
          clearInterval(timer);
        }
        if (code === 0) {
          const setCookie = res.headers['set-cookie'];

          const cookies = setCookie.map((ck: string) => {
            return ck.split(';')[0];
          });

          writeJsonFile({
            cookie: cookies.join(';'),
            token: refresh_token,
          });

          const user = await userInfo();

          console.log(user.data);
        } else {
          this.logger.log(message);
        }
      }, 3000);
    } else if (!qc) {
      this.logger.error('登陆接口失败');
    } else {
      this.logger.log(`是否为大会员：${qc.vip_status > 0 ? '是' : '否'}`);
    }
  }
}
