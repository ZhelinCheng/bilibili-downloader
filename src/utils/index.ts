/*
 * @Author       : Zhelin Cheng
 * @Date         : 2021-02-18 20:19:40
 * @LastEditors  : Zhelin Cheng
 * @LastEditTime : 2021-04-10 17:56:06
 * @FilePath     : \bilibili-downloader\src\utils\index.ts
 * @Description  : 未添加文件描述
 */

import pino from 'pino';
export * from './env';
export * from './request';
export * from './database';

export const logger = pino({
  prettyPrint: {
    colorize: true,
    translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
  },
});

export const env = process.env
