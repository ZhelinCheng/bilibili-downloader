/*
 * @Author       : Zhelin Cheng
 * @Date         : 2020-07-30 15:57:41
 * @LastEditors  : Zhelin Cheng
 * @LastEditTime : 2021-04-10 20:47:38
 * @FilePath     : \bilibili-downloader\src\index.ts
 * @Description  : 入口文件
 */
import { logger, db } from './utils';
import { CronJob } from 'cron';
import { downloader, getVideosUrl } from './core';

let timer: CronJob;

async function bootstrap() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  timer = new CronJob(
    '0 * * * * *',
    async () => {
      try {
        timer.stop();
        await getVideosUrl();
        await downloader();
        const notes = db.get('notes').value();
        if (notes.length > 20) {
          await db.set('notes', notes.slice(-20)).write();
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
