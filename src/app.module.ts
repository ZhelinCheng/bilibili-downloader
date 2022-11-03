/*
 * @Author       : 程哲林
 * @Date         : 2022-11-01 14:23:15
 * @LastEditors  : 程哲林
 * @LastEditTime : 2022-11-03 19:06:18
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
import { DataSource } from 'typeorm';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import * as path from 'path';
// import fse from 'fs-extra';
import { readCookie, login } from './utils';
import { Config } from './app.entities/config.entity';

function getDbConfig(): TypeOrmModuleOptions {
  const env = process.env;
  const isDev = env.NODE_ENV === 'development';

  return {
    type: 'sqlite',
    database: path.resolve(__dirname, '..', './.database'),
    entities: [path.resolve(__dirname, './**/*.entity{.ts,.js}')],
    maxQueryExecutionTime: isDev ? 200 : 100,
    logging: isDev ? true : ['error', 'warn'],
    synchronize: true,
    entityPrefix: 'bli_',
  };
}

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
    TypeOrmModule.forRoot(getDbConfig()),
    WatchModule,
    DownloadModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  constructor(
    private dataSource: DataSource,
    private readonly httpService: HttpService,
  ) {}
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
    const cfgCount = await this.dataSource.getRepository(Config).count();

    if (cfgCount === 0) {
      this.dataSource.getRepository(Config).save({});
    }

    // console.log(cfgCount);
    await login();
  }
}
