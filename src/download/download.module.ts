/*
 * @Author       : 程哲林
 * @Date         : 2022-11-01 15:07:48
 * @LastEditors  : 程哲林
 * @LastEditTime : 2022-11-01 15:10:24
 * @FilePath     : /bilibili-downloader/src/download/download.module.ts
 * @Description  : 未添加文件描述
 */
import { Module } from '@nestjs/common';
import { DownloadService } from './download.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Config } from '../app.entities/config.entity';
import { Queue } from '../app.entities/queue.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Queue, Config])],
  providers: [DownloadService],
})
export class DownloadModule {}
