/*
 * @Author       : Zhelin Cheng
 * @Date         : 2020-07-30 15:57:41
 * @LastEditors  : Zhelin Cheng
 * @LastEditTime : 2021-10-24 20:55:23
 * @FilePath     : \bilibili-downloader\src\index.ts
 * @Description  : 入口文件
 */
import { logger, db, env, isEnv } from './utils';
import { CronJob } from 'cron';
import ping from 'ping';
import fse from 'fs-extra';
import {
  outputPath,
  isFtp,
  INCLUDE_UID_ITEMS,
  EXCLUDE_UID_ITEMS,
} from './const';
import { downloader, getVideosUrl, upList, getVipStatus } from './core';

const args = process.argv.splice(2);

let timer: CronJob;

const executeInterval = env.BILIBILI_LISTEN_INTERVAL;

async function netOnline() {
  try {
    const [external, internal] = await Promise.all([
      ping.promise.probe('api.vc.bilibili.com'),
      ping.promise.probe(env.BILIBILI_FTP_HOST || '127.0.0.1'),
    ]);
    return external.alive && internal.alive;
  } catch (e) {
    logger.error('网络错误，请检查网络链接是否通畅，DNS配置是否正确。');
    return false;
  }
}

async function bootstrap(mid = '') {
  if (!isEnv) {
    logger.error(
      `未找到.env文件，请参考：https://github.com/ZhelinCheng/bilibili-downloader#readme`,
    );
    throw Error('未找到.env文件');
  }

  if (!env.BILIBILI_COOKIE) {
    logger.error(
      `未配置b站账号Cookie，请参考：https://jingyan.baidu.com/article/5d368d1ea6c6e33f60c057ef.html`,
    );
    throw Error('未配置b站账号Cookie');
  }

  if (!isFtp) {
    fse.ensureDirSync(outputPath);
  }

  process.env.BILIBILI_IS_VIP = (await getVipStatus()) ? 'yes' : '';

  // 直接下载
  if (mid) {
    const uid = db.get('uid').value();
    if (uid !== mid.toString()) {
      console.log('重置up主');
      await db.set('notes', []).write();
      await db.set('queue', []).write();
      await db.set('uid', mid.toString()).write();
    }

    const isOnline = await netOnline();
    if (!isOnline) {
      return;
    }
    await upList(mid);
    await downloader();
    return;
  }

  const interval =
    executeInterval && executeInterval !== '1' ? `0/${executeInterval}` : '*';

  logger.info(`执行间隔：${executeInterval ? executeInterval : 1}分钟`);
  timer = new CronJob(
    `0 ${interval} * * * *`,
    async () => {
      const isOnline = await netOnline();
      if (!isOnline) {
        return;
      }

      try {
        timer.stop();
        await getVideosUrl();
        await downloader();
        const notes = db.get('notes').value();
        if (notes.length > 40) {
          await db.set('notes', notes.slice(-40)).write();
        }
      } catch (e) {
        console.error(e);
      } finally {
        timer.start();
      }
    },
    null,
    true,
    'Asia/Shanghai',
  );
}

const mid = args
  .map((arg) => {
    const exec = /--up=(?<mid>\d+)/gim.exec(arg);
    return exec?.groups?.mid;
  })
  .filter((arg) => arg)[0];

bootstrap(mid)
  .then(() => {
    logger.info('启动成功');
    logger.info(`视频保存位置：${isFtp ? 'FTP服务器' : '本地'}`);
    logger.info(`必须包含的UID：${INCLUDE_UID_ITEMS.join('、')}`);
    logger.info(`必须排除的UID：${EXCLUDE_UID_ITEMS.join('、')}`);
  })
  .catch((e: Error) => {
    logger.error(`启动失败：${e.message}`);
  });
