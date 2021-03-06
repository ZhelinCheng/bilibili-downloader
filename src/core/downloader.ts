/*
 * @Author       : Zhelin Cheng
 * @Date         : 2021-02-19 15:16:57
 * @LastEditors  : 程哲林
 * @LastEditTime : 2022-06-19 19:08:07
 * @FilePath     : \bilibili-downloader\src\core\downloader.ts
 * @Description  : 未添加文件描述
 */

import axios from 'axios';
import fs from 'fs';
import path from 'path';
import fse from 'fs-extra';
import { db, logger, env, timeout } from '../utils';
import { mapLimit } from 'async';
import * as FTP from 'basic-ftp';
import { getVideoDownloadUrl, getVideoPage, VideoUrlItems } from './url';
import { postData } from './ftp';
import { outputPath, isFtp, BASE_FTP_PAtH, LIMIT_DURATION } from '../const';
// import dayjs from 'dayjs';

const client = new FTP.Client();
client.ftp.log = logger.info.bind(logger);
client.ftp.verbose = true;

const baseFtpPath = BASE_FTP_PAtH;

type BaseItemType = VideoUrlItems & { cid: string };

// import fs from 'fs';
// let cancelTokenSource: null | CancelTokenSource = null;

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
        referer: 'https://www.bilibili.com/video/av99999999',
      },
      responseType: 'stream',
    });
    return {
      data: data as NodeJS.ReadStream,
      headerSize: Number(headers['content-length']),
    };
  } catch (e) {
    console.error(e);
  }

  return { headerSize: 0 };
};

async function ftpLink() {
  try {
    if (client.closed && isFtp) {
      await client.access({
        host: env.BILIBILI_FTP_HOST,
        user: env.BILIBILI_FTP_USER,
        password: env.BILIBILI_FTP_PASS,
      });
    }
    return true;
  } catch (e) {
    console.error(e);
  }
  return false;
}

async function downloadList(
  queue: Array<BaseItemType>,
): Promise<Array<string>> {
  logger.info('开始执行下载');

  const isConnFtp = await ftpLink();

  if (!isConnFtp) {
    logger.error('FTP连接失败');
    return [];
  }

  // const date = dayjs().format('YYYYMMDDHHmm');
  const notes = db.get('notes').value() || [];

  return new Promise((resolve, reject) => {
    mapLimit(
      queue,
      1,
      async ({ bvid, name, cid, title = 'none' }) => {
        try {
          if (notes.includes(cid)) {
            return bvid;
          }

          await timeout(2000);
          logger.info(
            `下载 ⇒ 标题：${title} | 昵称：${name} | BVID：${bvid} | CID：${cid}`,
          );

          const { url, size, ext, length } = await getVideoDownloadUrl(
            bvid,
            cid,
          );
          const filePath = `${baseFtpPath}/${name}`;
          const fileName = `${title.replace(
            /(.{30}).*/,
            '$1...',
          )}_${bvid}_${cid}.${ext}`;
          const filePos = `${filePath}/${fileName}`;
          const localPath = path.join(outputPath, name, fileName);

          logger.info(`开始下载：${url}`);
          const { data, headerSize } = await downloadVideo(url);
          if (!data || size <= 0) {
            return '';
          }

          if (LIMIT_DURATION && length >= LIMIT_DURATION) {
            notes.push(cid);
            notes.push(bvid);
            db.set('notes', notes).write();
            logger.warn('视频长度超过600秒，跳过下载');
            return bvid;
          }

          logger.info(`保存中...`);
          const uploadFtp = await postData(
            client,
            data,
            filePath,
            fileName,
            localPath,
            baseFtpPath,
          );

          logger.info(`判断是否下载完成...`);

          // 再次连接FTP
          await ftpLink();
          const fileSize = isFtp
            ? await client.size(filePos)
            : fs.statSync(localPath).size;

          // 校验下载完整性及上传状态
          const isOver =
            fileSize === size && headerSize === fileSize && uploadFtp;

          logger.info(
            `状态 ⇒ ${isOver} | 文件大小：${fileSize} |  响应头：${headerSize} | 下载大小：${size}` +
              `${isFtp ? ` | FTP状态：${uploadFtp}` : ''}`,
          );

          // 删除不正确的文件
          if (!isOver && uploadFtp) {
            if (isFtp) {
              await client.remove(filePos);
            } else {
              fse.removeSync(localPath);
            }
          }

          if (isOver) {
            notes.push(cid);
            notes.push(bvid);
            await db.set('notes', notes).write();
          }

          return isOver ? bvid : '';
        } catch (e) {
          console.error(e);
          return '';
        }
      },
      async (err, results) => {
        // clearTimeout(errTimer);
        if (err) {
          return reject(err);
        }
        resolve(results as Array<string>);
      },
    );
  });
}

// 获取分集信息
export async function getPageList(
  queue: Array<VideoUrlItems>,
): Promise<Array<Array<BaseItemType>>> {
  logger.info('开始获取分集列表信息');
  return new Promise((resolve, reject) => {
    mapLimit(
      queue,
      2,
      async function ({ bvid, name, title = '' }) {
        const arr = getVideoPage(bvid, name, title);
        return arr;
      },
      (err, results) => {
        if (err) {
          return reject(err);
        }

        resolve(results as Array<Array<BaseItemType>>);
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

    let downQueue: Array<VideoUrlItems & { cid: string }> = [];

    // 获取分集信息
    const arr = await getPageList(queue);

    for (const item of arr) {
      downQueue = downQueue.concat(item);
    }

    // 应对404的情况
    if (downQueue.length <= 0 && queue.length) {
      queue.forEach(({ bvid }) => {
        downSuccess.push(bvid);
      });
    }

    const downQueueLen = downQueue.length;
    logger.info(`执行下载${downQueueLen}条`);

    if (downQueueLen <= 0) {
      logger.info('未执行下载');
    } else {
      // 执行下载
      const downStatus = await downloadList(downQueue);

      // 状态1：有下载失败，需要重新下载，状态2：表示成功
      const statusMemo: { [key: string]: number } = {};
      const downStatusLen = downStatus.length;

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
    }

    downSuccess.forEach(async (bvid: string) => {
      await db.get('queue').remove({ bvid }).write();
    });

    logger.info('+++ 本次下载完成 +++');
  } catch (e) {
    logger.error(e);
  } finally {
    if (isFtp && !client.closed) {
      client.close();
      logger.info(`关闭FTP：${client.closed}`);
    }
  }
};
