/*
 * @Author       : Zhelin Cheng
 * @Date         : 2021-02-19 14:59:08
 * @LastEditors  : Zhelin Cheng
 * @LastEditTime : 2021-05-31 22:27:42
 * @FilePath     : /bilibili-downloader/src/utils/database.ts
 * @Description  : 未添加文件描述
 */
import low from 'lowdb';
import FileSync from 'lowdb/adapters/FileSync';
import { resolve } from 'path';
import { VideoUrlItems } from '../core';

const adapter = new FileSync<{
  notes: string[];
  queue: VideoUrlItems[];
  errorFile: string;
}>(resolve(__dirname, '../../db.json'));

const db = low(adapter);

db.defaults({
  notes: [],
  queue: [],
  errorFile: '',
}).write();

export { db };
