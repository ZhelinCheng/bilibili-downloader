/*
 * @Author       : 程哲林
 * @Date         : 2022-11-01 15:07:07
 * @LastEditors  : 程哲林
 * @LastEditTime : 2022-11-03 20:10:24
 * @FilePath     : /bilibili-downloader/src/watch/watch.service.ts
 * @Description  : 未添加文件描述
 */
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { State } from 'src/app.state';
import { dynamicList, getVideoCid } from 'src/services/watch';
import { Repository, DataSource } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from '../app.entities/queue.entity';
import { Config } from '../app.entities/config.entity';
import Mint from 'mint-filter';
import { mapLimit } from 'async';
// import { Notes } from 'src/app.entities/notes.entity';

@Injectable()
export class WatchService {
  private readonly logger = new Logger(WatchService.name);

  constructor(
    private dataSource: DataSource,

    /*     @InjectRepository(Notes)
    private readonly notRep: Repository<Notes>,
 */
    @InjectRepository(Queue)
    private readonly queRep: Repository<Queue>,

    @InjectRepository(Config)
    private readonly cfgRep: Repository<Config>,
  ) {}

  @Cron('50 * * * * *')
  async handleCron() {
    if (!State.isLogin || State.isDownload) {
      return;
    }

    try {
      this.logger.log('执行动态列表查询...');
      const timeSet = new Set([]);

      const [conf, queueBvid] = await Promise.all([
        this.cfgRep.find(),
        this.queRep.find({
          select: ['bvid'],
        }),
      ]);

      const cfg = conf[0];
      State.cfg = cfg;

      const kws = cfg['keywords'] || '';
      const expire = cfg['expire'] || 600;

      const timeout = Math.floor(Date.now() / 1000) - expire;

      const mint = new Mint(kws.split(','));

      // 获取动态列表
      const { code, message, data } = await dynamicList(State.userId);

      const dynamicArr: Array<Omit<Queue, 'id'>> = [];

      const bvidSet = new Set(
        queueBvid.map(({ bvid }) => {
          return bvid;
        }),
      );

      // 筛选符合下载需求的数据
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
          timeSet.add(bvid);
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
          if (!bvidSet.has(bvid) && isKws && timeout < timestamp) {
            bvidSet.add(bvid);

            dynamicArr.push({
              timestamp,
              uid,
              bvid,
              name: uname,
              title,
              cid: 0,
              status: 0,
            });
          }
        }
      } else {
        this.logger.error(
          `错误代码：${code}；错误信息：${message || '无数据'}`,
        );
      }

      // 获取列表cid
      const qList = await this.allVideosCid<Omit<Queue, 'id'>>(dynamicArr);

      this.logger.log(`本次数据更新：${qList.length}条`);

      if (qList.length) {
        await Promise.all([
          this.queRep.save(qList),
          this.dataSource
            .createQueryBuilder()
            .delete()
            .from(Queue)
            .where('status = :status', { status: 1 })
            .andWhere('timestamp < :expire', {
              expire: timeout - 3600,
            })
            .execute(),
        ]);

        this.logger.log('本次动态数据更新完成');
      }
    } catch (e) {
      this.logger.error(e);
    } finally {
      State.isReady = true;
    }
  }

  /**
   * 获取动态cid
   * @param dynamicArr 动态列表
   * @returns 包含cid的列表
   */
  allVideosCid<T = any>(dynamicArr: Array<T>): Promise<T[]> {
    return new Promise((resolve, reject) => {
      mapLimit(
        dynamicArr,
        2,
        async (item: any) => {
          const data = await getVideoCid(item.bvid);

          return data.map(({ cid }) => {
            return {
              ...item,
              cid,
            };
          });
        },
        (err, res) => {
          if (err) {
            reject(err);
          } else {
            let arr: T[] = [];
            res.forEach((item) => {
              arr = arr.concat(item);
            });
            resolve(arr);
          }
        },
      );
    });
  }
}
