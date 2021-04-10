/*
 * @Author       : Zhelin Cheng
 * @Date         : 2021-04-10 17:52:51
 * @LastEditors  : Zhelin Cheng
 * @LastEditTime : 2021-04-10 17:58:01
 * @FilePath     : \bilibili-downloader\src\utils\env.ts
 * @Description  : 未添加文件描述
 */

import path from 'path';
import dotenv from 'dotenv';

dotenv.config({
  path: path.join(__dirname, '../../.env'),
});

interface EnvType {
    BILIBILI_COOKIE: string
    BILIBILI_UID: string
    BILIBILI_FTP_HOST: string
    BILIBILI_FTP_USER: string
    BILIBILI_FTP_PASS: string
    NODE_ENV: string
}

export const env = process.env as unknown as EnvType