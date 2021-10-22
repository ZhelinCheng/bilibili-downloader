/*
 * @Author       : Zhelin Cheng
 * @Date         : 2021-10-21 22:29:10
 * @LastEditors  : Zhelin Cheng
 * @LastEditTime : 2021-10-22 00:16:53
 * @FilePath     : \bilibili-downloader\src\core\up.ts
 * @Description  : 未添加文件描述
 */

import { getPageList } from './downloader';
import { logger, rq, db } from '../utils';

interface VideoItem {
  created: number;
  aid: number;
  bvid: string;
  length: string;
  author: string;
}

async function getVideos(
  mid: string,
  pageNum = 1,
): Promise<{
  next: boolean;
  items: VideoItem[];
}> {
  const { data } = await rq<{
    code: number;
    data: {
      list: {
        vlist: VideoItem[];
      };
      page: {
        pn: number;
        ps: number;
        count: number;
      };
    };
  }>({
    method: 'GET',
    url: 'https://api.bilibili.com/x/space/arc/search',
    params: {
      mid,
      ps: 60,
      pn: pageNum,
      order: 'pubdate',
    },
  });

  const {
    code,
    data: {
      list: { vlist },
      page,
    },
  } = data;

  if (code !== 0) {
    return {
      next: false,
      items: [],
    };
  }

  return {
    next: !(code === 0 && page.pn * 60 >= page.count),
    items: vlist,
  };
}

async function upList() {
  let next = true;
  let items: VideoItem[] = [];
  let pn = 1;

  while (next && pn < 10) {
    const data = await getVideos('15385187', pn++);
    next = data.next;
    items = items.concat(data.items);
  }

  logger.info('开始获取分集列表信息');
  const queue = items.map(({ bvid, author }) => {
    return {
      name: author,
      bvid,
    };
  });

  await db.set<'queue'>('queueUp', queue).write();
}

export { upList };
