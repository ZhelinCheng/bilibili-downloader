/*
 * @Author       : Zhelin Cheng
 * @Date         : 2021-04-20 19:10:56
 * @LastEditors  : Zhelin Cheng
 * @LastEditTime : 2021-05-17 20:51:39
 * @FilePath     : /bilibili-downloader/src/const/index.ts
 * @Description  : 未添加文件描述
 */

import { env } from '../utils/env';
import fse from 'fs-extra';
import { resolve } from 'path';

// 上传到FTP
export const isFtp = env.BILIBILI_FTP_HOST && env.BILIBILI_FTP_PASS;

// 本地存储地址
export const outputPath =
  env.BILIBILI_OUTPUT_PATH || resolve(__dirname, '../../output');

// 排除的UID
export const EXCLUDE_UID_ITEMS = ((): string[] => {
  const file = fse.readFileSync(resolve(__dirname, '../../.exclude'));
  console.log(file);
  return [];
})();

// 需要的UID
export const INCLUDE_UID_ITEMS = ((): string[] => {
  const file = fse.readFileSync(resolve(__dirname, '../../.include'));
  console.log(file);
  return [];
})();
