/*
 * @Author       : 程哲林
 * @Date         : 2022-11-05 16:48:48
 * @LastEditors  : 程哲林
 * @LastEditTime : 2023-06-03 00:17:37
 * @FilePath     : /bilibili-downloader/src/watch/watch.service.ts
 * @Description  : 未添加文件描述
 */

import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { State } from 'src/app.state';
import { dynamicList, favoritesDetails, getVideoCid } from 'src/services/watch';
import { Repository, DataSource } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from '../app.entities/queue.entity';
import { Config } from '../app.entities/config.entity';
import { List } from '../app.entities/list.entity';
import Mint from 'mint-filter';
import { mapLimit } from 'async';
import {
  checkRefresh,
  cookieRefresh,
  getCorrespondHtml,
  userInfo,
} from '@/services/login';
import fse from 'fs-extra';
import { resolve } from 'path';
import {
  arrayToObject,
  cookiePath,
  dbUpdate,
  getCorrespondPath,
  readCookie,
  readFile,
  writeJsonFile,
} from '@/utils';
import { ConfGroup } from '@/const';
// import { Notes } from 'src/app.entities/notes.entity';

type QueueBaseInfo = {
  cid: number;
  uid: number;
  bvid: string;
  name: string;
  title: string;
  desc: string;
  cover: string;
  videos: number;
  tags: string;
  timestamp: number;
  duration: number;
  part?: string;
};

@Injectable()
export class WatchService {
  private readonly logger = new Logger(WatchService.name);

  constructor(
    private dataSource: DataSource,

    @InjectRepository(Queue)
    private readonly queRep: Repository<Queue>,

    @InjectRepository(Config)
    private readonly cfgRep: Repository<Config>,

    @InjectRepository(List)
    private readonly listRep: Repository<List>,
  ) {}

  async checkRefresh() {
    const {
      data: { code, data },
    } = await checkRefresh();
    if (code === 0) {
      console.log(data);
      return data.timestamp;
      // return data.refresh ? data.timestamp : 0;
    } else {
      return -1;
    }
  }

  async refreshToken(ts: number) {
    try {
      const cookie = readFile(cookiePath);

      if (!cookie) {
        this.logger.error('未找到Cookie文件');
        return void 0;
      }

      const correspondPath = getCorrespondPath(ts);
      // >(?<name>[0-9a-fA-F]{32})<

      const authUrl = `https://www.bilibili.com/correspond/1/${correspondPath}`;
      console.log(authUrl);

      const htmlRes = await getCorrespondHtml(authUrl);
      const htmlStr = htmlRes.data;
      const exec = /htmlStr/gim.exec(htmlStr);

      console.log(htmlStr, exec.groups);

      if (!exec.groups?.name) {
        this.logger.error('未获取到刷新name');
        return void 0;
      }

      console.log({
        csrf: cookie.cookieJson.bili_jct,
        refresh_csrf: exec.groups.name,
        source: 'main_web',
        refresh_token: cookie.token,
      });

      const res = await cookieRefresh({
        csrf: cookie.cookieJson.bili_jct,
        refresh_csrf: exec.groups.name,
        source: 'main_web',
        refresh_token: cookie.token,
      });

      if (res.data.code !== 0) {
        this.logger.error(res.data.message || 'Cookie刷新失败');
        return void 0;
      }

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
        token: res.data.data.refresh_token,
        cookieJson,
      });

      State.isLogin = true;
      this.logger.log('Cookie刷新成功');
    } catch (e) {
      console.error(e);
    }
  }

  // @Cron('0 */3 * * * *')
  /* async handleCron() {
    try {
      if (!State.isLogin || !State.isReady) {
        return void 0;
      }

      const ts = await this.checkRefresh();
      if (ts !== 0) {
        State.isLogin = false;
        if (ts > 0) {
          await this.refreshToken(ts);
        } else {
          this.logger.error('登录信息失效');
        }

        return void 0;
      }

      State.isReady = false;

      this.logger.log(
        `执行动态列表查询... [isLogin: ${State.isLogin}] [isReady: ${State.isReady}]`,
      );

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

          const excludeUid = cfg.exclude.split(',').filter((i) => i);
          const includeUid = cfg.include.split(',').filter((i) => i);

          const uidStr = uid.toString();

          // 关键词通过
          const isKwsPass = !kws || !mint.validator(title + ',' + tags);

          // 基本判断通过：不是已经放入队列的，且没有超时
          const isBasicPass = !bvidSet.has(bvid) && timeout < timestamp;

          // 排除条件通过
          const isExPass = !excludeUid.includes(uidStr);

          // 必须包含通过
          const isInPass = includeUid.includes(uidStr);

          // 条件1：是必须包含的用户，会跳过关键词、排除校验
          const condition1 = isInPass && isBasicPass;

          // 条件2：不是排除用户，且命中关键词
          const condition2 = isExPass && isKwsPass && isBasicPass;

          if (condition1 || condition2) {
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
        await this.queRep.save(qList);
        await Promise.all([
          this.dataSource
            .createQueryBuilder()
            .update(Config)
            .set({ lastTime: Math.floor(Date.now() / 1000) })
            .where('id = :id', { id: cfg.id })
            .execute(),
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

        State.isReady = true;
        this.logger.log('本次动态数据更新完成');
      }
    } catch (e) {
      State.isReady = true;
      this.logger.error(e);
    }
  } */

  /**
   * 获取动态cid
   * @param dynamicArr 动态列表
   * @returns 包含cid的列表
   */
  allVideosCid(dynamicArr: QueueBaseInfo[]): Promise<QueueBaseInfo[]> {
    return new Promise((resolve, reject) => {
      mapLimit(
        dynamicArr,
        2,
        async (item: QueueBaseInfo) => {
          if (item.videos > 1) {
            const data = await getVideoCid(item.bvid);

            return data.map(({ cid, part }) => {
              return {
                ...item,
                cid,
                part,
              };
            });
          }

          return item;
        },
        (err, res) => {
          if (err) {
            reject(err);
          } else {
            let arr: QueueBaseInfo[] = [];
            res.forEach((item) => {
              arr = arr.concat(item);
            });
            resolve(arr);
          }
        },
      );
    });
  }

  ready = true;
  @Cron('*/30 * * * * *')
  async handleCron() {
    try {
      if (!State.cookie || !this.ready) {
        return void 0;
      }

      this.ready = false;
      const ui = await userInfo();

      if (ui.code !== 0) {
        this.ready = true;
        return void 0;
      }

      this.logger.log(`执行动态列表查询...`);

      // 获取基本配置
      const [conf, queueBvid, list] = await Promise.all([
        this.cfgRep.find(),
        this.queRep.find({
          select: ['bvid'],
        }),
        this.listRep.find({
          select: ['uid', 'status'],
        }),
      ]);

      const blacklist = new Set([]);
      const whitelist = new Set([]);
      const bvidList = new Set(
        queueBvid.map(({ bvid }) => {
          return bvid;
        }),
      );

      list.forEach(({ uid, status }) => {
        if (status) {
          whitelist.add(uid);
        } else {
          blacklist.add(uid);
        }
      });
      const cfg = arrayToObject(conf);

      const expire = cfg['overtimeLimit'] || 600;
      const durationLimit = cfg['durationLimit'] || 300;

      const kws: string[] = cfg['keywords'];
      const mint = new Mint(kws);
      const scope = cfg['scope'] as Array<number>;

      // 视频获取列表
      const videosList = [];

      scope.forEach((id: number) => {
        if (id === 1) {
          videosList.push(this.getDynamicList());
        } else {
          videosList.push(this.getFavoritesDetails(id));
        }
      });

      const res: Array<QueueBaseInfo[]> = await Promise.all(videosList);

      const qList: QueueBaseInfo[] = [].concat(...res);

      const nowTime = Math.ceil(Date.now() / 1000);
      const filterQueue = qList.filter(
        ({ duration, uid, tags, desc, title, bvid, timestamp }) => {
          // ===== 这些是基础判断，优先级最高 =====

          // 判断用户是否在黑名单内，如果在就跳过
          if (blacklist.has(uid)) {
            return false;
          }

          // 判断是否下载过
          if (bvidList.has(bvid)) {
            return false;
          }

          // 判断是否超期，超过expire的数据不再下载
          if (nowTime - timestamp > expire) {
            return false;
          }

          // 判断视频是否太长
          if (duration > durationLimit) {
            return false;
          }

          // ===== 这些是个性化判断 =====

          // 判断是否在必须下载的名单内，如果在，就必定下载
          if (whitelist.has(uid)) {
            return true;
          }

          // 判断是否命中下载关键词，如果未配置，也直接下载
          if (kws.length <= 0) {
            return true;
          }

          return !mint.verify(`${tags}|${title}|${desc}`);
        },
      );

      const completeQueue = await this.allVideosCid(filterQueue);

      /* await this.queRep.save(
        completeQueue.map(({ uid, name, title, part, cover, bvid, cid }) => {
          return {
            uid,
            name,
            title,
            part: part || '',
            cover,
            bvid,
            cid,
            createdTime: nowTime,
            completeTime: nowTime,
          };
        }),
      ); */

      /* await Promise.all([
        this.dataSource
          .createQueryBuilder()
          .delete()
          .from(Queue)
          .where('status = :status', { status: 0 })
          .andWhere('timestamp < :expire', {
            expire: timeout - 3600,
          })
          .execute(),
      ]); */

      this.logger.log(
        `数据写入到下载队列：${completeQueue.length}条 | 获取${qList.length}条 | 过滤后${filterQueue.length}条`,
      );
    } catch (e) {
      console.error(e);
    } finally {
      this.ready = true;
    }
  }

  async getFavoritesDetails(mid: number): Promise<Array<QueueBaseInfo>> {
    try {
      const res = await favoritesDetails(mid);

      if (!res) {
        return [];
      }

      const { data, code } = res;

      if (code !== 0) {
        return [];
      }

      const tags = data.info.title + ',收藏夹';

      return data.medias?.map(
        ({
          intro,
          title,
          bvid,
          cover,
          duration,
          fav_time,
          page,
          upper: { mid, name },
          ugc: { first_cid },
        }) => {
          return {
            cid: first_cid,
            uid: mid,
            bvid,
            timestamp: fav_time,
            name,
            duration,
            title: title?.replace(/\s|<|>|:|"|\/|\\|\?|\*|\|/gm, ''),
            desc: intro,
            cover,
            videos: page,
            tags,
          };
        },
      );
    } catch (e) {
      console.error(e);
    }

    return [];
  }

  /**
   * 获取动态列表
   * @returns 动态信息
   */
  async getDynamicList(): Promise<Array<QueueBaseInfo>> {
    try {
      const res = await dynamicList(State.userId);

      if (!res) {
        return [];
      }

      const { code, data } = res;
      if (code === 0) {
        const list = data;
        return list.cards?.map(
          ({
            desc: {
              uid,
              bvid,
              timestamp,
              user_profile: {
                info: { uname },
              },
            },
            card,
          }) => {
            const cardJson = JSON.parse(card);
            return {
              cid: cardJson.cid,
              uid,
              bvid,
              timestamp,
              name: uname,
              duration: cardJson.duration,
              title: cardJson.title?.replace(/\s|<|>|:|"|\/|\\|\?|\*|\|/gm, ''),
              desc: cardJson.desc,
              cover: cardJson.pic,
              videos: cardJson.videos,
              tags: cardJson.tname,
            };
          },
        );
      }
    } catch (e) {
      console.error(e);
    }

    return [];
  }
}
