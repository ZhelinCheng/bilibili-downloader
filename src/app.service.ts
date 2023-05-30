/*
 * @Author       : 程哲林
 * @Date         : 2022-11-01 14:23:15
 * @LastEditors  : 程哲林
 * @LastEditTime : 2023-05-30 14:45:26
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
import { ConfQueryDto } from './app.dto/query.dto';
import { ConfGroup, DataType } from './const';

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

  async getConfig({ group }: ConfQueryDto): Promise<Record<string, any>> {
    const config = await this.cfgRep.find({
      where: { group },
    });

    const obj = {};

    if (Array.isArray(config)) {
      config.forEach(({ key, value, type }) => {
        let newVal: any = value;
        switch (type) {
          case DataType.NUMBER: {
            newVal = parseInt(value);
            break;
          }
          case DataType.STRING: {
            newVal = value;
            break;
          }
          default: {
            newVal = JSON.parse(value);
          }
        }
        obj[key] = newVal;
      });
    }

    return obj;
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
      const cookieJson: Record<string, string> = {};

      const cookies = setCookie.map((ck: string) => {
        const ckItem = ck.split(';')[0];
        const kv = ckItem.split('=');
        cookieJson[kv[0]] = kv[1];
        return ckItem;
      });

      writeJsonFile({
        cookie: cookies.join(';'),
        token: data.refresh_token,
        cookieJson,
      });

      // this.dataSource.manager.update()

      /* this.cfgRep
        .createQueryBuilder()
        .update(Config)
        .set({
          cookie: cookies.join(';'),

        })
        .where('group = :group', { group: ConfGroup.USER }); */

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
