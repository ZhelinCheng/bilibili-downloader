/*
 * @Author       : Zhelin Cheng
 * @Date         : 2021-02-19 14:59:08
 * @LastEditors  : Zhelin Cheng
 * @LastEditTime : 2021-10-22 00:00:57
 * @FilePath     : \bilibili-downloader\src\utils\database.ts
 * @Description  : 未添加文件描述
 */
import low from 'lowdb';
import FileSync from 'lowdb/adapters/FileSync';
import { resolve } from 'path';
import { VideoUrlItems } from '../core';

const adapter = new FileSync<{
  notes: string[];
  queue: VideoUrlItems[];
  queueUp: VideoUrlItems[];
  errorFile: string;
}>(resolve(__dirname, '../../db.json'));

const db = low(adapter);

db.defaults({
  notes: [],
  queue: [],
  queueUp: [],
  errorFile: '',
}).write();

export { db };
