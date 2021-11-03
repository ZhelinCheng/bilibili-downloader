/*
 * @Author       : Zhelin Cheng
 * @Date         : 2021-02-18 20:19:40
 * @LastEditors  : Zhelin Cheng
 * @LastEditTime : 2021-11-03 22:07:45
 * @FilePath     : \bilibili-downloader\src\utils\index.ts
 * @Description  : 未添加文件描述
 */

import pino from 'pino';
export * from './env';
export * from './request';
export * from './database';

export const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
    },
  },
});

export const timeout = (time = 1000): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, time);
  });
};

export const env = process.env;
