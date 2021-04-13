/*
 * @Author       : Zhelin Cheng
 * @Date         : 2020-07-30 15:57:41
 * @LastEditors  : Zhelin Cheng
 * @LastEditTime : 2021-04-13 10:08:41
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
      ping.promise.probe('www.baidu.com'),
      ping.promise.probe(env.BILIBILI_FTP_HOST || ''),
    ]);
    return external.alive && internal.alive
  } catch (e) {
    return false;
  }
}

async function bootstrap() {

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  timer = new CronJob(
    '0 * * * * *',
    async () => {
      const isOnline = await netOnline()
      if (!isOnline) {
        return
      }

      try {
        timer.stop();
        const status = await getVideosUrl();
        if (status) {
          await downloader();
        }
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
