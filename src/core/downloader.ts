/*
 * @Author       : Zhelin Cheng
 * @Date         : 2021-02-19 15:16:57
 * @LastEditors  : Zhelin Cheng
 * @LastEditTime : 2021-05-31 22:30:14
 * @FilePath     : /bilibili-downloader/src/core/downloader.ts
 * @Description  : 未添加文件描述
 */

import axios, { CancelTokenSource } from 'axios';
import fs from 'fs';
import fse from 'fs-extra';
import { db, logger, env } from '../utils';
import { mapLimit } from 'async';
import PromiseFtp from 'promise-ftp';
import { getVideoDownloadUrl, getVideoPage, VideoUrlItems } from './url';
import { postData } from './ftp';
import { outputPath, isFtp } from '../const';
import dayjs from 'dayjs';

const ftp = new PromiseFtp();

const baseFtpPath = env.BILIBILI_FTP_PATH || '/Multimedia/Bilibili';

type BaseItemType = VideoUrlItems & { cid: string };

// import fs from 'fs';
let cancelTokenSource: null | CancelTokenSource = null;

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
    cancelTokenSource = axios.CancelToken.source();
    const { data, headers } = await axios({
      method: 'get',
      url,
      headers: {
        Cookie: '',
      },
      cancelToken: cancelTokenSource.token,
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

async function ftpLink() {
  try {
    if (isFtp) {
      logger.info(`FTP状态：${ftp.getConnectionStatus()}`);
      const serverMessage = await ftp.connect({
        host: env.BILIBILI_FTP_HOST,
        user: env.BILIBILI_FTP_USER,
        password: env.BILIBILI_FTP_PASS,
      });

      const errFile = db.get('errorFile').value();
      if (errFile) {
        logger.info('删除错误文件');
        await ftp.delete(errFile);
        await db.set('errorFile', '').write();
      }
      logger.info(serverMessage);
      // ftp.mkdir(baseFtpPath, true)
    } else {
      logger.info(`存储到本地：${outputPath}`);
    }
    return true;
  } catch (e) {
    console.error(e);
  }
  return false;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
// let errTimer: any = 0

// 下载列表
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let errTimer: any = 0;
async function downloadList(
  queue: Array<BaseItemType>,
): Promise<Array<string>> {
  logger.info('开始执行下载');

  const isConnFtp = await ftpLink();

  if (!isConnFtp) {
    return [];
  }

  const date = dayjs().format('YYYYMMDDHHmm');
  const notes = db.get('notes').value() || [];

  return new Promise((resolve, reject) => {
    mapLimit(
      queue,
      1,
      async ({ bvid, name, cid }) => {
        try {
          clearTimeout(errTimer);
          if (notes.includes(cid)) {
            return bvid;
          }

          logger.info(`下载 ⇒ 昵称：${name} | BVID：${bvid} | CID：${cid}`);

          const { url, size, ext } = await getVideoDownloadUrl(bvid, cid);
          const filePath = `${baseFtpPath}/${name}`;
          const fileName = `${date}-${cid}.${ext}`;
          const filePos = `${filePath}/${fileName}`;
          const localPath = `${outputPath}/${name}/${fileName}`;

          // 超时删除
          errTimer = setTimeout(async () => {
            if (
              cancelTokenSource &&
              typeof cancelTokenSource.cancel === 'function'
            ) {
              logger.error('清除下载');
              cancelTokenSource.cancel('清除超时文件');
              if (isFtp) {
                await db.set('errorFile', filePos).write();
                ftp.destroy();
              } else {
                fse.removeSync(localPath);
              }
            }
            cancelTokenSource = null;
            reject('未下载完成');
          }, 480000);

          logger.info(`开始下载：${url}`);
          const { data, headerSize } = await downloadVideo(url);
          if (!data || size <= 0) {
            return '';
          }

          logger.info(`保存中...`);
          const uploadFtp = await postData(
            ftp,
            data,
            filePath,
            fileName,
            localPath,
          );

          logger.info(`判断是否下载完成...`);
          const fileSize = isFtp
            ? await ftp.size(filePos)
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
              await ftp.delete(filePos);
            } else {
              fse.removeSync(localPath);
            }
          }

          /* if (isOver) {
            notes.push(cid);
            notes.push(bvid);
            await db.set('notes', notes).write();
          } */

          return isOver ? bvid : '';
        } catch (e) {
          console.error(e);
          return '';
        }
      },
      async (err, results) => {
        clearTimeout(errTimer);
        if (isFtp) {
          await ftp.end();
        }
        if (err) {
          return reject(err);
        }
        resolve(results as Array<string>);
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

    logger.info(`执行下载${downQueue.length}条`);
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

    // console.log(downSuccess)

    logger.info('删除已下载完成的bvid');
    downSuccess.forEach(async (bvid: string) => {
      await db.get('queue').remove({ bvid }).write();
    });

    logger.info('+++ 本次下载完成 +++');
  } catch (e) {
    logger.error(e);
  }
};
