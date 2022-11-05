/*
 * @Author       : 程哲林
 * @Date         : 2022-11-01 14:23:15
 * @LastEditors  : 程哲林
 * @LastEditTime : 2022-11-05 15:52:28
 * @FilePath     : /bilibili-downloader/src/app.service.ts
 * @Description  : 未添加文件描述
 */
import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { Queue } from './app.entities/queue.entity';
import { Config } from './app.entities/config.entity';
import { Repository, DataSource } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { State } from './app.state';
import { getQrCode, loginStatus, userInfo } from './services/login';
import { writeJsonFile } from './utils';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);
  constructor(
    private dataSource: DataSource,

    @InjectRepository(Queue)
    private readonly queRep: Repository<Queue>,

    @InjectRepository(Config)
    private readonly cfgRep: Repository<Config>,
  ) {}

  async getConfig(): Promise<{
    config: Config;
    isLogin: boolean;
    vipStatus: boolean;
  }> {
    const config = await this.cfgRep.findOne({
      where: { id: 1 },
    });

    return {
      isLogin: State.isLogin,
      vipStatus: State.vipStatus,
      config,
    };
  }

  async qrCodeGenerate() {
    const {
      data: { code, data, message },
    } = await getQrCode();

    if (code === 0) {
      return data;
    } else {
      throw new HttpException(
        message || '获取二维码失败',
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  async loginPoll(qrcodeKey: string) {
    const res = await loginStatus(qrcodeKey);
    const { code, data, message } = res.data;

    if (code !== 0) {
      throw new HttpException(
        message || '扫码状态获取失败',
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (data.code == 0) {
      const setCookie = res.headers['set-cookie'];

      const cookies = setCookie.map((ck: string) => {
        return ck.split(';')[0];
      });

      writeJsonFile({
        cookie: cookies.join(';'),
        token: data.refresh_token,
      });

      this.logger.log('扫码成功');

      await userInfo();
    }

    return data.code;
  }

  async saveConfig(body: Config) {
    const id = body.id;
    delete body.id;
    const { affected } = await this.dataSource
      .createQueryBuilder()
      .update(Config)
      .set(body)
      .where('id = :id', { id })
      .execute();

    return affected === 1;
  }
}
