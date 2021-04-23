/*
 * @Author       : Zhelin Cheng
 * @Date         : 2021-04-20 19:10:56
 * @LastEditors  : Zhelin Cheng
 * @LastEditTime : 2021-04-23 23:53:42
 * @FilePath     : \bilibili-downloader\src\const\index.ts
 * @Description  : 未添加文件描述
 */

import { env } from '../utils/env';
import { resolve } from 'path';

// 上传到FTP
export const isFtp = env.BILIBILI_FTP_HOST && env.BILIBILI_FTP_PASS;

// 本地存储地址
export const outputPath =
  env.BILIBILI_OUTPUT_PATH || resolve(__dirname, '../../output');
