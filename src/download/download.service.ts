/*
 * @Author       : 程哲林
 * @Date         : 2022-11-01 15:07:48
 * @LastEditors  : 程哲林
 * @LastEditTime : 2023-06-05 20:42:48
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
import { getPlayUrl } from 'src/services/download';
import * as path from 'path';
import * as fs from 'fs';
import * as fse from 'fs-extra';
import * as shell from 'shelljs';
import * as FTP from 'basic-ftp';
import * as WebDAV from 'webdav';
import { arrayToObject, getDownloadDir } from '@/utils';
import { ConfGroup, StorageType } from '@/const';
// import * as CliProgress from 'cli-progress';

shell.config.silent = true;

/* const multibar = new CliProgress.MultiBar(
  {
    clearOnComplete: false,
    hideCursor: true,
  },
  CliProgress.Presets.shades_grey,
); */

const cachePath = path.resolve(__dirname, '../..', 'cache');

// 确保输出文件夹存在
fse.ensureDirSync(cachePath);
// fse.ensureDirSync(localOutputPath);

const timeout = (wait = 1000) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(true);
    }, wait);
  });
};

const writeStreamFile = (
  input: NodeJS.ReadStream,
  localPath: string,
): Promise<boolean> => {
  input.pipe(fs.createWriteStream(localPath), { end: true });
  return new Promise((resolve, reject) => {
    input.on('end', function () {
      resolve(true);
    });

    input.on('error', function (err) {
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

  // FTP客户端
  ftpClient: FTP.Client;
  wdClient: WebDAV.WebDAVClient;

  cfg: Record<string, any> = {};

  ready = true;
  @Cron('*/10 * * * * *')
  async handleCron() {
    // TODO: 下载失败多少次就暂停
    if (!State.isLogin || !this.ready) {
      return void 0;
    }

    this.ready = false;

    this.logger.log(`执行文件下载流程...`);

    const [conf, queue] = await Promise.all([
      this.cfgRep.find({
        where: {
          group: ConfGroup.DOWNLOAD,
        },
      }),
      this.queRep.find({
        where: {
          status: 0,
        },
      }),
    ]);

    this.cfg = arrayToObject(conf);

    if (queue.length <= 0) {
      this.logger.log('没有需要下载的视频');
    } else {
      await this.downloadTask(queue);
    }

    this.ready = true;
  }

  async createDownloadDir(name: string) {
    const { storageType = StorageType.LOCAL, outputPath = getDownloadDir() } =
      this.cfg;

    const op = path.join(outputPath, name);

    let pass = true;

    switch (storageType) {
      case StorageType.LOCAL: {
        fse.ensureDirSync(op);
        break;
      }
      case StorageType.WEBDAV: {
        pass = await this.createWebDAVClient(op);
        break;
      }
      case StorageType.FTP: {
        pass = await this.createFTPClient(op);
        break;
      }
    }

    return pass;
  }

  async videoTag(id: number, status: number) {
    return await this.dataSource
      .createQueryBuilder()
      .update(Queue)
      .set({ status })
      .where('id = :id', { id })
      .execute();
  }

  async downloadTask(list: Queue[]) {
    let idx = 0;

    // 清空缓冲目录
    fse.emptyDirSync(cachePath);

    while (idx < list.length) {
      const item = list[idx];
      const { name, title, bvid, cid, id } = item;

      this.logger.log(`开始执行下载 ——>《${title}》—— ${name}`);

      this.logger.log(`获取下载地址 ——> bvid:${bvid} cid:${cid}`);

      const res = await getPlayUrl(bvid, cid);

      if (typeof res === 'number') {
        if (res === -404) {
          // 未找到视频时，标记视频
          await this.videoTag(id, 3);
        }
        continue;
      }

      // 获取视频地址
      const videoUrl = res.dash.video[0].baseUrl;
      const audioUrl = res.dash.audio[0].baseUrl;

      this.logger.log(`执行视频下载 ——> 标题：${title}`);

      const [videoStatus, audioStatus] = await Promise.all([
        this.downloadUrl(videoUrl, 'video', bvid, cid),
        this.downloadUrl(audioUrl, 'audio', bvid, cid),
      ]);

      const isFinish = videoStatus && audioStatus;
      this.log('视频缓存状态', isFinish);

      // 下载失败跳过
      if (!isFinish) {
        continue;
      }

      const isConcat = this.concatVideo(item);

      this.log('视频合成状态', isConcat);

      if (!isConcat) {
        continue;
      }

      const isPush = await this.pushRemote(item);

      this.log('视频下载状态', isPush);

      idx++;
    }
  }

  log(msg: string, status: boolean) {
    if (status) {
      this.logger.log(`${msg} ——> 成功`);
    } else {
      this.logger.error(`${msg} ——> 失败`);
    }
  }

  downFilePath(cid: number) {
    return {
      audio: path.join(cachePath, `${cid}.a.m4s`),
      video: path.join(cachePath, `${cid}.v.m4s`),
    };
  }

  async downloadUrl(
    url: string,
    type: 'audio' | 'video',
    bvid: string,
    cid: number,
  ) {
    try {
      if (!url) {
        return false;
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

      const file = this.downFilePath(cid);
      const pt = file[type];

      // fse.removeSync(pt);

      await writeStreamFile(data, pt);

      const fileSize = fs.statSync(pt).size;

      const scale = fileSize / hdSize;
      return scale > 0.999 && scale < 1.001;
    } catch (e) {
      console.error(e);
    }

    return false;
  }

  async concatVideo({ name, title, bvid, cid }: Queue) {
    try {
      // 创建目录
      const isSuccess = await this.createDownloadDir(name);

      if (!isSuccess) {
        this.logger.error('文件夹创建失败');
        return false;
      }

      const { outputPath, storageType, namingType } = this.cfg;
      const fileName = namingType
        .replace('{username}', name)
        .replace('{title}', title)
        .replace('{bvid}', bvid)
        .replace('{cid}', cid);

      const isLocal = storageType === StorageType.LOCAL;

      // 判断存储位置是本地的话就合成到输出文件夹，如果不是就合成到缓冲文件夹
      const mp4File = isLocal
        ? `${path.join(outputPath, name, fileName)}.mp4`
        : `${path.join(cachePath, cid.toString())}.mp4`;

      const ceFile = this.downFilePath(cid);
      this.logger.log(1);
      const { code } = shell.exec(
        `ffmpeg -i ${ceFile.audio} -i ${ceFile.video} -codec copy ${mp4File} -y`,
      );
      this.logger.log(2);
      return code === 0;
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  async ftpWrite(cid: number, outputPath: string) {
    await this.ftpClient.uploadFromDir(
      path.join(cachePath, `${cid}.mp4`),
      outputPath,
    );
  }

  webdavWrite(cid: number, outputPath: string) {
    return new Promise((resolve, reject) => {
      const input = fs.createReadStream(path.join(cachePath, `${cid}.mp4`));
      input.pipe(this.wdClient.createWriteStream(outputPath));

      input.on('end', function () {
        resolve(true);
      });

      input.on('error', function (err) {
        reject(err);
      });
    });
  }

  async pushRemote(item: Queue) {
    try {
      const { storageType = StorageType.LOCAL, outputPath } = this.cfg;

      const op = path.join(outputPath, item.name);

      switch (storageType) {
        case StorageType.WEBDAV: {
          await this.webdavWrite(item.cid, op);
          break;
        }
        case StorageType.FTP: {
          await this.ftpWrite(item.cid, op);
          break;
        }
      }

      return true;
    } catch (e) {
      console.error(e);
    }

    return false;
  }

  async createFTPClient(outputPath?: string) {
    try {
      const { remoteURL, account, password } = this.cfg;

      if (!this.ftpClient) {
        this.ftpClient = new FTP.Client();
        this.ftpClient.ftp.verbose = false;

        await this.ftpClient.access({
          host: remoteURL,
          user: account,
          password: password,
        });
      }

      if (outputPath) {
        await this.ftpClient.ensureDir(outputPath);
      }

      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  async createWebDAVClient(outputPath?: string) {
    try {
      const { remoteURL, account, password } = this.cfg;

      if (!this.wdClient) {
        this.wdClient = WebDAV.createClient(remoteURL, {
          authType: WebDAV.AuthType.Password,
          username: account,
          password,
        });
      }

      if (outputPath) {
        await this.wdClient.createDirectory(outputPath);
      }
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  // @Cron('30 */3 * * * *')
  /*  async handleCron() {
    if (!State.isReady) {
      return;
    }
    State.isReady = false;

    try {
      this.logger.log(`执行文件下载流程... [isReady: ${State.isReady}]`);

      const [conf, que] = await Promise.all([
        this.cfgRep.find(),
        this.queRep.find({
          where: {
            status: 0,
          },
        }),
      ]);

      if (que.length <= 0) {
        return this.logger.log('没有需要下载的视频');
      }

      const cfg = conf[0];
      State.cfg = cfg;

      // 文件名
      this.fileName = cfg.fileName || '{{title}}';
      // 输出目录

      const { saveType } = cfg;

      // 创建输出目录
      if (saveType === 'local') {
        outputPath = cfg.outputPath || localOutputPath;
      } else {
        outputPath = localOutputPath;
      }

      // 创建下载目录
      fse.ensureDirSync(localOutputPath);
      const ids = await this.downloadTask(que, cfg.duration || 0);

      this.logger.log(`下载完成${ids.length}个视频`);

      if (ids.length) {
        // 下面开始走其他流程
        await this.createFtpClient();
      }

      // 清空缓存目录
      await timeout(3000);
      fse.emptyDirSync(cachePath);

      State.isReady = true;
    } catch (e) {
      State.isReady = true;
      console.error(e);
    }
  }

  async createFtpClient() {
    const {
      saveType,
      ftpAccount,
      ftpRemote,
      ftpPassword,
      outputPath: opt,
    } = State.cfg;

    if (saveType !== 'ftp') {
      return;
    }

    try {
      this.logger.log('创建FTP');
      // 创建FTP客户端
      this.ftpClient = new FTP.Client();
      this.ftpClient.ftp.verbose = false;

      await this.ftpClient.access({
        host: ftpRemote,
        user: ftpAccount,
        password: ftpPassword,
      });

      if (!this.ftpClient?.closed) {
        // 确保FTP目录存在并上传
        await this.ftpClient.ensureDir(opt);
        await this.ftpClient.uploadFromDir(localOutputPath, opt);

        this.logger.log('上传至FTP服务器完成');

        fse.emptyDirSync(localOutputPath);
      } else {
        this.logger.error('FTP创建失败');
      }
    } catch (e) {
      console.error(e);
    } finally {
      // 关闭链接
      this.ftpClient?.close();
      this.ftpClient = undefined;
    }
  }

  async concatVideo({ name, title, bvid, cid }: Queue) {
    try {
      const filePath = path.join(outputPath, name);
      const mp4File = `${path.join(outputPath, name, this.fileName)}.mp4`;

      fse.ensureDirSync(filePath);

      const ceFile = this.downFilePath(cid);
      const { code } = shell.exec(
        `ffmpeg -i ${ceFile.audio} -i ${ceFile.video} -codec copy ${mp4File} -y`
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

  async videoTag(id: number) {
    return await this.dataSource
      .createQueryBuilder()
      .update(Queue)
      .set({ status: 1 })
      .where('id = :id', { id })
      .execute();
  }

  async downloadTask(que: Queue[], duration: number): Promise<number[]> {
    return new Promise((resolve, reject) => {
      mapLimit(
        que,
        1,
        async (item: Queue) => {
          try {
            const { bvid, cid, id, title, name } = item;
            const res = await getPlayUrl(bvid, cid);

            const videoName = `${name} - ${title}`;

            // 未获取到视频资源标记
            if (typeof res === 'number') {
              if (res === -404) {
                // 未找到视频时
                await this.videoTag(id);
                return id;
              }
              return null;
            }

            const videoUrl = res.dash.video[0].baseUrl;
            const audioUrl = res.dash.audio[0].baseUrl;
            const timelength = Math.ceil(res.timelength / 1000);

            // 超出限制标记
            if (duration > 0 && timelength > duration) {
              this.logger.log(`【${videoName}】超出限制，放弃下载`);
              await this.videoTag(id);
              return id;
            }

            this.logger.log(`下载视频：${videoName}`);

            const [vStatus, aStatus] = await Promise.all([
              this.downloadUrl(videoUrl, 'video', bvid, cid),
              this.downloadUrl(audioUrl, 'audio', bvid, cid),
            ]);

            const isDownStatus = vStatus && aStatus;

            // console.log(isDownStatus);
            if (!isDownStatus) {
              this.logger.error(
                `视频：【${videoName}】下载失败，等待下次下载 | ${vStatus} | ${aStatus}`,
              );
              return null;
            }

            this.logger.log(`合并视频：${videoName}`);
            // 执行视频合并
            const concatStatus = await this.concatVideo(item);

            // 下载合并成功标记
            if (concatStatus) {
              await this.videoTag(id);
            }

            return concatStatus ? id : null;
          } catch (e) {
            console.error(e);
            return null;
          }
        },
        (err, res) => {
          if (err) reject(err);
          else resolve(res.filter((id: number) => id > 0));
        },
      );
    });
  }

  downFilePath(cid: number) {
    return {
      audio: path.join(cachePath, `${cid}.a.m4s`),
      video: path.join(cachePath, `${cid}.v.m4s`),
    };
  }

  async downloadUrl(
    url: string,
    type: 'audio' | 'video',
    bvid: string,
    cid: number,
  ) {
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

      const file = this.downFilePath(cid);
      const pt = file[type];

      // fse.removeSync(pt);

      await fileSave(data, pt);

      const fileSize = fs.statSync(pt).size;

      this.logger.log(
        `下载信息：${bvid} ${type} ${fileSize} ${hdSize} [${url}]`,
      );

      const scale = fileSize / hdSize;
      return scale > 0.999 && scale < 1.001;
    } catch (e) {
      console.error(e);
    }

    return false;
  } */
}
