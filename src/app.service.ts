/*
 * @Author       : 程哲林
 * @Date         : 2022-11-01 14:23:15
 * @LastEditors  : 程哲林
 * @LastEditTime : 2023-06-02 11:15:30
 * @FilePath     : /bilibili-downloader/src/app.service.ts
 * @Description  : 未添加文件描述
 */
import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
// import { Queue } from './app.entities/queue.entity';
import { Config } from './app.entities/config.entity';
// import { List } from './app.entities/list.entity';
import { Repository, DataSource } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { getQrCode, loginStatus, userInfo } from './services/login';
import { arrayToObject, dbUpdate } from './utils';
import { ConfQueryDto } from './app.dto/query.dto';
import { ConfGroup } from './const';
import { State } from './app.state';
import { UpdateConfigDto } from './app.dto/update.dto';
import { getFavorites } from './services/watch';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);
  constructor(
    private dataSource: DataSource,

    /* @InjectRepository(Queue)
    private readonly queRep: Repository<Queue>, */

    @InjectRepository(Config)
    private readonly cfgRep: Repository<Config> /* @InjectRepository(List)
    private readonly listRep: Repository<List>, */,
  ) {}

  async getFavorites() {
    const res = await getFavorites(State.userId);

    if (res.code === 0) {
      return res.data.list.map(({ id, title }) => {
        return { id, title };
      });
    }

    return [];
  }

  async getUserInfo(): Promise<any> {
    const res = await userInfo();
    if (res.code === 0) {
      return res.data;
    }

    throw new HttpException('未登录', HttpStatus.UNAUTHORIZED);
  }

  async getConfig({ group }: ConfQueryDto): Promise<Record<string, any>> {
    const config = await this.cfgRep.find({
      where: { group },
    });
    return arrayToObject(config);
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
      const setCookies = res.headers['set-cookie'];
      // const cookieJson: Record<string, string> = {};

      const cookies = setCookies.map((ck: string) => {
        const ckItem = ck.split(';')[0];
        // const kv = ckItem.split('=');
        // cookieJson[kv[0]] = kv[1];
        return ckItem;
      });

      await dbUpdate(this.dataSource, Config, [
        {
          where: {
            group: ConfGroup.USER,
            key: 'cookie',
          },
          update: {
            value: cookies.join(';'),
          },
        },
        {
          where: {
            group: ConfGroup.USER,
            key: 'refreshToken',
          },
          update: {
            value: data.refresh_token,
          },
        },
      ]);

      State.cookie = cookies.join(';');
      this.logger.log('扫码成功');
      // await userInfo();
    }

    return data.code;
  }

  async updateConfig({ config }: UpdateConfigDto) {
    return await dbUpdate(
      this.dataSource,
      Config,
      config.map(({ group, key, value }) => {
        return {
          where: {
            group,
            key,
          },
          update: {
            value,
          },
        };
      }),
    );
  }
}
