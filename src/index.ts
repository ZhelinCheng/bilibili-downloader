/*
 * @Author       : Zhelin Cheng
 * @Date         : 2020-07-30 15:57:41
 * @LastEditors  : Zhelin Cheng
 * @LastEditTime : 2021-04-19 20:48:24
 * @FilePath     : /bilibili-downloader/src/index.ts
 * @Description  : 入口文件
 */
import { logger, db, env } from './utils';
import { CronJob } from 'cron';
import ping from 'ping';
import { downloader, getVideosUrl } from './core';

let timer: CronJob;

async function netOnline() {
  try {
    const [external, internal] = await Promise.all([
      ping.promise.probe('api.vc.bilibili.com'),
      ping.promise.probe(env.BILIBILI_FTP_HOST || '127.0.0.1'),
    ]);
    return external.alive && internal.alive
  } catch (e) {
    return false;
  }
}

async function bootstrap() {
  // console.log(env.BILIBILI_FTP_PATH )
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  timer = new CronJob(
    '0 0/2 * * * *',
    async () => {
      const isOnline = await netOnline()
      if (!isOnline) {
        return
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
        timer.start()
      }
    },
    null,
    true,
    'Asia/Shanghai',
  );
}

bootstrap()
  .then(() => {
    logger.info('启动成功');
  })
  .catch((e) => {
    console.error(e);
  });
