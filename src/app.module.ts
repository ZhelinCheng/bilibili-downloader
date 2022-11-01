/*
 * @Author       : 程哲林
 * @Date         : 2022-11-01 14:23:15
 * @LastEditors  : 程哲林
 * @LastEditTime : 2022-11-01 15:53:12
 * @FilePath     : /bilibili-downloader/src/app.module.ts
 * @Description  : 未添加文件描述
 */

import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { WatchModule } from './watch/watch.module';
import { DownloadModule } from './download/download.module';
import { join } from 'path';

@Module({
  imports: [
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
export class AppModule {}
