/*
 * @Author       : 程哲林
 * @Date         : 2022-11-01 15:07:07
 * @LastEditors  : 程哲林
 * @LastEditTime : 2022-11-01 22:12:24
 * @FilePath     : /bilibili-downloader/src/watch/watch.service.ts
 * @Description  : 未添加文件描述
 */
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { State } from 'src/app.state';
import { dynamicList } from 'src/services/watch';
import { Repository, DataSource } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from '../app.entities/queue.entity';
import { Config } from '../app.entities/config.entity';
import Mint from 'mint-filter';

@Injectable()
export class WatchService {
  private readonly logger = new Logger(WatchService.name);

  constructor(
    private dataSource: DataSource,

    @InjectRepository(Queue)
    private readonly queRep: Repository<Queue>,

    @InjectRepository(Config)
    private readonly cfgRep: Repository<Config>,
  ) {}

  @Cron('*/30 * * * * *')
  async handleCron() {
    this.logger.log('执行动态列表查询...');

    const cfg = await this.cfgRep.find();
    const kwsMap = {};
    cfg.map(({ key, value }) => {
      kwsMap[key] = value;
    });

    const kws = kwsMap['keywords'] || '';
    const expire = kwsMap['expire'] || 600;

    const timeout = Math.floor(Date.now() / 1000) - expire;

    const mint = new Mint(kws.split(','));

    const { code, message, data } = await dynamicList(State.userId);
    if (code === 0 && Array.isArray(data?.cards) && data?.cards?.length) {
      for (const {
        display: {
          topic_info = {
            topic_details: [],
          },
        },
        card = '',
        desc: {
          uid,
          bvid,
          timestamp,
          user_profile: {
            info: { uname },
          },
        },
      } of data.cards) {
        const { topic_details } = topic_info;
        const jsonCard = JSON.parse(card || '{}');

        // 安全的标题
        const title = (jsonCard?.title || 'none').replace(
          /\s|<|>|:|"|\/|\\|\?|\*|\|/gm,
          '',
        );

        const tags = topic_details
          .map(({ topic_name }) => topic_name)
          .join(',');

        // 关键词
        const isKws = !mint.validator(title + ',' + tags) || !kws;
        if (isKws && timeout < timestamp) {
          console.log({
            timestamp,
            uid,
            bvid,
            name: uname,
            title,
            tags,
          });
        }
      }
    } else {
      this.logger.error(`错误代码：${code}；错误信息：${message || '无数据'}`);
    }
  }
}
