/*
 * @Author       : 程哲林
 * @Date         : 2022-11-01 14:23:15
 * @LastEditors  : 程哲林
 * @LastEditTime : 2023-05-19 16:34:47
 * @FilePath     : /bilibili-downloader/src/main.ts
 * @Description  : 未添加文件描述
 */
// import { join } from 'path';

import { NestFactory } from '@nestjs/core';
import { VersioningType } from '@nestjs/common';
import { AppModule } from './app.module';
import { TransformInterceptor } from './app.interceptor';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as shell from 'shelljs';

/* import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify'; */
// import FFCors from '@fastify/cors';
// import FFFormbody from '@fastify/formbody';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // app.useStaticAssets(join(__dirname, '..', 'public'));
  app.enableCors();
  app.setGlobalPrefix('api');

  app.enableVersioning({
    defaultVersion: '1',
    type: VersioningType.URI,
  });

  // 格式转换
  app.useGlobalInterceptors(new TransformInterceptor());

  const port = parseInt(process.env.BLI_PORT, 10) || 2233;

  await app.listen(port);

  const serverUrl = await app.getUrl();
  console.log(`
  运行环境：${process.env.NODE_ENV}
  管理页面：${serverUrl}
  `);
}

const isFFmpeg = shell.which('ffmpeg');
const isSQLite3 = shell.which('sqlite3');

if (isFFmpeg && isSQLite3) {
  bootstrap();
} else {
  console.error(
    `
    请先自行下载安装依赖并配置环境变量：
    ffmpeg：${isFFmpeg ? '正常' : '未安装'}
    sqlite3：${isSQLite3 ? '正常' : '未安装'}
    `,
  );
}
