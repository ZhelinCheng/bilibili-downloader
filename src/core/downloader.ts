/*
 * @Author       : Zhelin Cheng
 * @Date         : 2021-02-19 15:16:57
 * @LastEditors  : Zhelin Cheng
 * @LastEditTime : 2021-04-12 19:40:13
 * @FilePath     : /bilibili-downloader/src/core/downloader.ts
 * @Description  : 未添加文件描述
 */

import axios from 'axios';
import { db, logger, env } from '../utils';
import { mapLimit } from 'async';
import PromiseFtp from 'promise-ftp';
import { getVideoDownloadUrl, getVideoPage, VideoUrlItems } from './url';
import { postData } from './ftp';

const ftp = new PromiseFtp();

type BaseItemType = VideoUrlItems & { cid: string };

// import fs from 'fs';

export const downloadVideo = async (
  url: string,
): Promise<{
  data: NodeJS.ReadStream;
  size: number;
}> => {
  try {
    if (!url) {
      return;
    }

    const { data, headers } = await axios({
      method: 'get',
      url,
      headers: {
        Cookie: '',
      },
      responseType: 'stream',
    });
    return {
      data,
      size: Number(headers['content-length']),
    };
  } catch (e) {
    console.error(e);
  }
};

// 下载列表
async function downloadList(
  queue: Array<BaseItemType>,
): Promise<Array<string>> {
  logger.info('开始执行下载');
  const serverMessage = await ftp.connect({
    host: env.BILIBILI_FTP_HOST,
    user: env.BILIBILI_FTP_USER,
    password: env.BILIBILI_FTP_PASS,
  });
  logger.info(serverMessage);
  const date = new Date();
  const notes = db.get('notes').value();

  return new Promise((resolve, reject) => {
    mapLimit(
      queue,
      1,
      async function ({ bvid, name, cid }) {
        try {
          logger.info(`下载 ⇒ 昵称：${name} | BVID：${bvid} | CID：${cid}`);
          const url = await getVideoDownloadUrl(bvid, cid);
          const { data, size } = await downloadVideo(url);

          if (!data || size <= 0) {
            return '';
          }

          if (notes.includes(cid)) {
            return bvid
          }

          const filePath = `/Multimedia/Bilibili/${name}`;
          const fileName = `${cid}_${date.getMinutes()}.flv`;
          const filePos = `${filePath}/${fileName}`;

          const uploadFtp = await postData(ftp, data, filePath, fileName);
          const fileSize = (await ftp.size(filePos)) || 0;

          // 校验下载完整性及上传状态
          const isOver = fileSize === size && uploadFtp;

          if (isOver) {
            const dbNotes = db.get<'notes'>('notes')
            dbNotes.push(bvid);
            await dbNotes.push(cid).write();
          }

          logger.info(
            `状态 ⇒ ${isOver} | 文件大小：${fileSize} | 下载大小：${size} | FTP状态：${uploadFtp}`,
          );

          // 删除不正确的文件
          if (!isOver && uploadFtp) {
            await ftp.delete(filePos);
          }

          return isOver ? bvid : '';
        } catch (e) {
          return '';
        }
      },
      async (err, results: Array<string>) => {
        await ftp.end();
        if (err) {
          return reject(err);
        }
        resolve(results);
      },
    );
  });
}

// 获取分集信息
async function getPageList(
  queue: Array<VideoUrlItems>,
): Promise<Array<Array<BaseItemType>>> {
  logger.info('开始获取分集列表信息');
  return new Promise((resolve, reject) => {
    mapLimit(
      queue,
      2,
      async function ({ bvid, name }) {
        const arr = getVideoPage(bvid, name);
        return arr;
      },
      (err, results: Array<Array<BaseItemType>>) => {
        if (err) {
          return reject(err);
        }

        resolve(results);
      },
    );
  });
}

export const downloader = async (): Promise<void> => {
  try {
    const queue = db.get('queue').value();
    if (queue.length <= 0) {
      return;
    }

    logger.info(`执行下载${queue.length}条`);
    let downQueue: Array<VideoUrlItems & { cid: string }> = [];

    // 获取分集信息
    const arr = await getPageList(queue);
    for (const item of arr) {
      downQueue = downQueue.concat(item);
    }

    // 执行下载
    const downStatus = await downloadList(downQueue);

    // 状态1：有下载失败，需要重新下载，状态2：表示成功
    const statusMemo: { [key: string]: number } = {};
    downQueue.forEach(({ bvid }, index: number) => {
      // 本次下载状态
      const status = downStatus[index];
      // 保存的下载状态
      const saveStatus = statusMemo[bvid];

      // 保存
      if (!saveStatus) {
        statusMemo[bvid] = 2
      }

      // 当下载失败时
      if (!status) {
        statusMemo[bvid] = 1
      }
    });

    const downSuccess: string[] = []
    for (const [key, val] of Object.entries(statusMemo)) {
      if (val === 2) {
        downSuccess.push(key)
      }
    }

    logger.info('删除已下载完成的bvid');
    downSuccess.forEach(async (bvid: string) => {
      await db.get('queue').remove({ bvid }).write();
    });

    logger.info('+++ 本次下载完成 +++');
  } catch (e) {
    console.error(e);
  }
};
