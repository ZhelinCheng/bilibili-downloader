/*
 * @Author       : Zhelin Cheng
 * @Date         : 2021-02-19 15:16:57
 * @LastEditors  : Zhelin Cheng
 * @LastEditTime : 2021-04-19 20:48:11
 * @FilePath     : /bilibili-downloader/src/core/downloader.ts
 * @Description  : 未添加文件描述
 */

import axios from 'axios';
import { db, logger, env } from '../utils';
import { mapLimit } from 'async';
import PromiseFtp from 'promise-ftp';
import { getVideoDownloadUrl, getVideoPage, VideoUrlItems } from './url';
import { postData } from './ftp';
import dayjs from 'dayjs'

const ftp = new PromiseFtp();

const baseFtpPath = env.BILIBILI_FTP_PATH || '/Multimedia/Bilibili'

type BaseItemType = VideoUrlItems & { cid: string };

// import fs from 'fs';

export const downloadVideo = async (
  url: string,
): Promise<{
  data?: NodeJS.ReadStream;
  headerSize: number;
}> => {
  try {
    if (!url) {
      return { headerSize: 0 };
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
      headerSize: Number(headers['content-length']),
    };
  } catch (e) {
    console.error(e);
  }

  return { headerSize: 0 };
};

async function ftpLink () {
  try {
    const serverMessage = await ftp.connect({
      host: env.BILIBILI_FTP_HOST,
      user: env.BILIBILI_FTP_USER,
      password: env.BILIBILI_FTP_PASS
    });
    logger.info(serverMessage);
    // ftp.mkdir(baseFtpPath, true)
    return true
  } catch(e) {
    console.error(e)
  }
  return false
} 

// 下载列表
async function downloadList(
  queue: Array<BaseItemType>,
): Promise<Array<string>> {
  logger.info('开始执行下载');

  const isConnFtp = await ftpLink()

  if (!isConnFtp) {
    return []
  }

  const date = dayjs().format('YYYYMMDDHHmm')
  const notes = db.get('notes').value() || [];

  return new Promise((resolve, reject) => {
    mapLimit(
      queue,
      1,
      async function ({ bvid, name, cid }) {
        try {
          if (notes.includes(cid)) {
            return bvid;
          }
          
          logger.info(`下载 ⇒ 昵称：${name} | BVID：${bvid} | CID：${cid}`);
          const { url, size } = await getVideoDownloadUrl(bvid, cid);
          const { data, headerSize } = await downloadVideo(url);

          if (!data || size <= 0) {
            return '';
          }

          const filePath = `${baseFtpPath}/${name}`;
          const fileName = `${date}-${cid}.flv`;
          const filePos = `${filePath}/${fileName}`;

          const uploadFtp = await postData(ftp, data, filePath, fileName);
          const fileSize = (await ftp.size(filePos)) || 0;

          // 校验下载完整性及上传状态
          const isOver = fileSize === size && headerSize === fileSize && uploadFtp;

          if (isOver) {
            notes.push(cid);
            notes.push(bvid);
          }

          logger.info(
            `状态 ⇒ ${isOver} | 文件大小：${fileSize} |  响应头大小：${headerSize} | 下载大小：${size} | FTP状态：${uploadFtp}`,
          );

          // 删除不正确的文件
          if (!isOver && uploadFtp) {
            await ftp.delete(filePos);
          }

          return isOver ? bvid : '';
        } catch (e) {
          console.error(e);
          return '';
        }
      },
      async (err, results: Array<string>) => {
        await ftp.end();
        await db.set('notes', notes).write();
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
    const downSuccess: string[] = [];
    const queue = db.get('queue').value();
    if (queue.length <= 0) {
      return;
    }

    logger.info(`执行下载${queue.length}条`);
    let downQueue: Array<VideoUrlItems & { cid: string }> = [];

    // 获取分集信息
    const arr = await getPageList(queue);

    // 应对404的情况
    if (arr.length <= 0 && queue.length) {
      queue.forEach(({ bvid }) => {
        downSuccess.push(bvid)
      })
    }

    for (const item of arr) {
      downQueue = downQueue.concat(item);
    }

    // 执行下载
    const downStatus = await downloadList(downQueue);

    // 状态1：有下载失败，需要重新下载，状态2：表示成功
    const statusMemo: { [key: string]: number } = {};
    const downStatusLen = downStatus.length
    downQueue.forEach(({ bvid }, index: number) => {
      // 本次下载状态
      const status = downStatus[index];
      // 保存的下载状态
      const saveStatus = statusMemo[bvid];

      // 保存
      if (!saveStatus) {
        statusMemo[bvid] = 2;
      }

      // 当下载失败时
      if (!status && downStatusLen) {
        statusMemo[bvid] = 1;
      }
    });

   
    for (const [key, val] of Object.entries(statusMemo)) {
      if (val === 2) {
        downSuccess.push(key);
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
