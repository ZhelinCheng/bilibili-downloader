/*
 * @Author       : 程哲林
 * @Date         : 2022-11-01 15:07:48
 * @LastEditors  : 程哲林
 * @LastEditTime : 2022-11-04 13:38:34
 * @FilePath     : /bilibili-downloader/src/download/download.service.ts
 * @Description  : 未添加文件描述
 */
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { State } from 'src/app.state';
import { Repository, DataSource } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from '../app.entities/queue.entity';
import { Config } from '../app.entities/config.entity';
import axios from 'axios';
import { mapLimit } from 'async';
import { getPlayUrl } from 'src/services/download';
import * as path from 'path';
import * as fs from 'fs';
import * as fse from 'fs-extra';
import * as ffmpegPath from 'ffmpeg-static';
import * as shell from 'shelljs';
// import * as CliProgress from 'cli-progress';

shell.config.silent = true;

/* const multibar = new CliProgress.MultiBar(
  {
    clearOnComplete: false,
    hideCursor: true,
  },
  CliProgress.Presets.shades_grey,
); */

let outputPath = path.resolve(__dirname, '../..', 'output');
const cachePath = path.resolve(__dirname, '../..', 'cache');

const audio = `${cachePath}/audio.m4s`;
const video = `${cachePath}/video.m4s`;

// 确保输出文件夹存在
fse.ensureDirSync(outputPath);
fse.ensureDirSync(cachePath);

/* const timeout = (wait = 1000) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(true);
    }, wait);
  });
};
 */
const fileSave = (
  input: NodeJS.ReadStream,
  localPath: string,
  // length?: number,
): Promise<boolean> => {
  // const pg = multibar.create(length, 0);
  // let count = 0;

  input.pipe(fs.createWriteStream(localPath), { end: true });
  // input.end()
  return new Promise((resolve, reject) => {
    /* input.on('data', function (chunk) {
      pg.update((count += chunk.length));
    }); */

    input.on('end', function () {
      resolve(true);
    });

    input.on('error', function (err) {
      // pg.stop();
      reject(err);
    });
  });
};

@Injectable()
export class DownloadService {
  private readonly logger = new Logger(DownloadService.name);

  constructor(
    private dataSource: DataSource,

    @InjectRepository(Queue)
    private readonly queRep: Repository<Queue>,

    @InjectRepository(Config)
    private readonly cfgRep: Repository<Config>,
  ) {}

  fileName = '';

  @Cron('0 * * * * *')
  async handleCron() {
    if (!State.isReady) {
      return;
    }
    State.isReady = false;

    try {
      this.logger.log('执行文件下载流程...');

      const [conf, que] = await Promise.all([
        this.cfgRep.find({
          select: ['duration'],
        }),
        this.queRep.find({
          where: {
            status: 0,
          },
        }),
      ]);

      const cfg = conf[0];
      // 文件名
      this.fileName = cfg.fileName || '{{title}}';
      // 输出目录
      outputPath = cfg.outputPath || outputPath;

      const ids = await this.downloadTask(que, cfg.duration);

      console.log(ids);

      let count = ids.length;
      await this.dataSource.transaction(async () => {
        while (count--) {
          const id = ids[count];
          await this.dataSource
            .createQueryBuilder()
            .update(Queue)
            .set({ status: 1 })
            .where('id = :id', { id })
            .execute();
        }
      });

      this.logger.log('下载完成');
      this.delCache();
    } catch (e) {
      console.error(e);
    } finally {
      State.isReady = true;
    }
  }

  delCache() {
    fse.removeSync(audio);
    fse.removeSync(video);
  }

  async concatVideo({ name, title, bvid, cid }: Queue) {
    try {
      const isFFmpeg = shell.which('ffmpeg');

      const filePath = path.join(outputPath, name);
      const mp4File = `${path.join(outputPath, name, this.fileName)}.mp4`;

      fse.ensureDirSync(filePath);
      // fse.removeSync(mp4File);

      const { code } = shell.exec(
        `${
          isFFmpeg ? 'ffmpeg' : ffmpegPath
        } -i ${video} -i ${audio} -codec copy ${mp4File} -y`
          .replace('{{title}}', title)
          .replace('{{bvid}}', bvid)
          .replace('{{cid}}', cid.toString()),
      );

      return code === 0;
    } catch (e) {
      console.error(e);
    }
    return false;
  }

  async downloadTask(que: Queue[], duration: number): Promise<number[]> {
    return new Promise((resolve, reject) => {
      mapLimit(
        que,
        1,
        async (item: Queue) => {
          const { bvid, cid, id, title, name } = item;
          const res = await getPlayUrl(bvid, cid);

          if (!res) {
            return id;
          }

          // multibar.stop();

          const videoUrl = res.dash.video[0].baseUrl;
          const audioUrl = res.dash.audio[0].baseUrl;
          // const timelength = res.timelength;

          this.logger.log(`下载：${name} - ${title}`);

          const [vStatus, aStatus] = await Promise.all([
            this.downloadUrl(videoUrl, 'video', bvid),
            this.downloadUrl(audioUrl, 'audio', bvid),
          ]);

          const isDownStatus = vStatus && aStatus;

          // console.log(isDownStatus);
          if (!isDownStatus) {
            return null;
          }

          // await timeout(500);
          this.logger.log('视频合并中...');
          // 执行视频合并
          const concatStatus = await this.concatVideo(item);

          return concatStatus ? id : null;
        },
        (err, res) => {
          if (err) reject(err);
          else resolve(res.filter((id: number) => id > 0));
        },
      );
    });
  }

  async downloadUrl(url: string, type: 'audio' | 'video', bvid?: string) {
    try {
      if (!url) {
        return { headerSize: 0 };
      }
      const { data, headers } = await axios({
        method: 'get',
        url,
        headers: {
          referer: `https://www.bilibili.com/video/${bvid || 'bvid12123'}`,
        },
        responseType: 'stream',
      });

      const hdSize = Number(headers['content-length']);

      const pt = type === 'audio' ? audio : video;
      fse.removeSync(pt);

      await fileSave(data, pt);

      const fileSize = fs.statSync(pt).size;

      const scale = fileSize / hdSize;
      return scale > 0.999 && scale < 1.001;
    } catch (e) {
      console.error(e);
    }

    return false;
  }
}
