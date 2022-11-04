/*
 * @Author       : 程哲林
 * @Date         : 2022-11-01 14:23:15
 * @LastEditors  : 程哲林
 * @LastEditTime : 2022-11-04 21:30:20
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
// import { AxiosRequestConfig } from 'axios';
import { DataSource } from 'typeorm';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { Config } from 'src/app.entities/config.entity';
import { Queue } from 'src/app.entities/queue.entity';
import { userInfo } from './services/login';
import { State } from './app.state';
import { readCookie } from './utils';
const dbPath = path.resolve(__dirname, '..', './.database');
// import { readCookie, login } from './utils';

function getDbConfig(): TypeOrmModuleOptions {
  const env = process.env;
  const isDev = env.NODE_ENV === 'development';

  return {
    type: 'sqlite',
    database: dbPath,
    entities: [path.resolve(__dirname, './**/*.entity{.ts,.js}')],
    maxQueryExecutionTime: isDev ? 200 : 100,
    logging: isDev ? true : ['error', 'warn'],
    synchronize: !fs.existsSync(dbPath),
    entityPrefix: 'bli_',
  };
}

@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
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
    TypeOrmModule.forFeature([Queue, Config]),
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

  async onApplicationBootstrap(): Promise<void> {
    const cfgCount = await this.dataSource.getRepository(Config).count();

    if (cfgCount === 0) {
      await this.dataSource.getRepository(Config).save({
        outputPath: path.join(__dirname, '..', 'output'),
      });
    }

    // 获取配置信息
    State.cfg = await this.dataSource.getRepository(Config).find()[0];

    if (readCookie()) {
      const {
        data: { code },
      } = await userInfo();

      if (code !== 0) {
        this.logger.error('未登录，请进入管理页面进行登录');
      }
    }
  }
}
