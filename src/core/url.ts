/*
 * @Author       : Zhelin Cheng
 * @Date         : 2021-04-10 17:35:02
 * @LastEditors  : Zhelin Cheng
 * @LastEditTime : 2021-05-17 22:34:48
 * @FilePath     : /bilibili-downloader/src/core/url.ts
 * @Description  : 未添加文件描述
 */
import { rq, env, db, logger } from '../utils';
import { INCLUDE_UID_ITEMS, EXCLUDE_UID_ITEMS } from '../const';

const _MY_UID = /DedeUserID=(?<userId>\d+);/gm.exec(env.BILIBILI_COOKIE || '');

export interface VideoUrlItems {
  bvid: string;
  name: string;
}

interface DynamicNewType {
  code: number;
  msg: string;
  message: string;
  data: Data;
}

interface Data {
  new_num: number;
  exist_gap: number;
  update_num: number;
  open_rcmd: number;
  fold_mgr: Foldmgr[];
  cards: Card2[];
  attentions: Attentions;
  max_dynamic_id: number;
  history_offset: number;
  _gt_: number;
}

interface Attentions {
  uids: number[];
}

interface Card2 {
  desc: Desc;
  card: string;
  extend_json: string;
  display: Display;
  activity_infos?: Activityinfos;
}

interface Activityinfos {
  details: Detail[];
}

interface Detail {
  type: number;
  detail: string;
}

interface Display {
  topic_info?: Topicinfo;
  usr_action_txt: string;
  relation: Relation;
  show_tip: Showtip;
  cover_play_icon_url: string;
  like_info?: Likeinfo;
  tags?: Tag[];
  comment_info?: Commentinfo;
}

interface Commentinfo {
  comments: Comment[];
  emojis?: Emoji[];
}

interface Emoji {
  emoji_name: string;
  url: string;
  meta: Meta;
}

interface Meta {
  size: number;
}

interface Comment {
  uid: number;
  name: string;
  content: string;
}

interface Tag {
  tag_type: number;
  icon: string;
  text: string;
  link: string;
  sub_module: string;
  sub_type?: number;
  rid?: number;
}

interface Likeinfo {
  display_text: string;
  like_users: Likeuser[];
}

interface Likeuser {
  uid: number;
  uname: string;
}

interface Showtip {
  del_tip: string;
}

interface Relation {
  status: number;
  is_follow: number;
  is_followed: number;
}

interface Topicinfo {
  topic_details: Topicdetail[];
}

interface Topicdetail {
  topic_id: number;
  topic_name: string;
  is_activity: number;
  topic_link: string;
}

interface Desc {
  uid: number;
  type: number;
  rid: number;
  acl: number;
  view: number;
  repost: number;
  like: number;
  is_liked: number;
  dynamic_id: number;
  timestamp: number;
  pre_dy_id: number;
  orig_dy_id: number;
  orig_type: number;
  user_profile: Userprofile;
  uid_type: number;
  stype: number;
  r_type: number;
  inner_id: number;
  status: number;
  dynamic_id_str: string;
  pre_dy_id_str: string;
  orig_dy_id_str: string;
  rid_str: string;
  bvid: string;
  origin?: Origin;
}

interface Origin {
  uid: number;
  type: number;
  rid: number;
  acl: number;
  view: number;
  repost: number;
  like: number;
  dynamic_id: number;
  timestamp: number;
  pre_dy_id: number;
  orig_dy_id: number;
  uid_type: number;
  stype: number;
  r_type: number;
  inner_id: number;
  status: number;
  dynamic_id_str: string;
  pre_dy_id_str: string;
  orig_dy_id_str: string;
  rid_str: string;
  bvid: string;
}

interface Userprofile {
  info: Info;
  card: Card;
  vip: Vip;
  pendant: Pendant;
  rank: string;
  sign: string;
  level_info: Levelinfo;
  decorate_card?: Decoratecard;
}

interface Decoratecard {
  mid: number;
  id: number;
  card_url: string;
  card_type: number;
  name: string;
  expire_time: number;
  card_type_name: string;
  uid: number;
  item_id: number;
  item_type: number;
  big_card_url: string;
  jump_url: string;
  fan: Fan;
  image_enhance: string;
}

interface Fan {
  is_fan: number;
  number: number;
  color: string;
  num_desc: string;
}

interface Levelinfo {
  current_level: number;
}

interface Pendant {
  pid: number;
  name: string;
  image: string;
  expire: number;
  image_enhance: string;
  image_enhance_frame: string;
}

interface Vip {
  vipType: number;
  vipDueDate: number;
  vipStatus: number;
  themeType: number;
  label: Label;
  avatar_subscript: number;
  nickname_color: string;
  role: number;
  avatar_subscript_url: string;
}

interface Label {
  path: string;
  text: string;
  label_theme: string;
  text_color: string;
  bg_style: number;
  bg_color: string;
  border_color: string;
}

interface Card {
  official_verify: Officialverify;
}

interface Officialverify {
  type: number;
  desc: string;
}

interface Info {
  uid: number;
  uname: string;
  face: string;
}

interface Foldmgr {
  fold_type: number;
  folds: Fold[];
}

interface Fold {
  dynamic_ids: number[];
}

interface VideoPageType {
  cid: string;
}

interface VideoDownloadUrl {
  durl: Array<{
    url: string;
    size: number;
  }>;
}

// 获取用户是否是大会员
let isVip = false;
export const getVipStatus = async (): Promise<boolean> => {
  try {
    const nowTime = Date.now();
    const {
      data: { code, data },
    } = await rq<{
      code: number;
      data: {
        vip_due_date: number;
      };
    }>({
      url: 'https://api.bilibili.com/x/vip/web/user/info',
    });

    return code === 0 && data.vip_due_date > nowTime;
  } catch (e) {
    console.error(e);
  }

  return false;
};

// 获取单个分集信息
export const getVideoDownloadUrl = async (
  bvid: string,
  cid: string,
): Promise<{
  size: number;
  url: string;
  ext: 'flv' | 'mp4';
}> => {
  try {
    const {
      data: { code, data },
    } = await rq<{
      code: number;
      data: VideoDownloadUrl;
    }>({
      url: 'https://api.bilibili.com/x/player/playurl',
      params: isVip
        ? {
            bvid,
            cid,
            qn: 120,
            fourk: 1,
          }
        : {
            bvid,
            cid,
            platform: 'html5',
            high_quality: 1,
          },
    });

    if (code === 0 && data && Array.isArray(data.durl)) {
      const { url = '', size } = data.durl[0];
      const urlExt = /\.(?<ext>mp4|flv)\?/.exec(url) || {
        groups: { ext: 'flv' },
      };
      return {
        url,
        size,
        ext:
          urlExt && urlExt.groups
            ? (urlExt.groups.ext as 'flv' | 'mp4')
            : 'flv',
      };
    }
  } catch (e) {
    console.error(e);
  }

  return {
    url: '',
    size: 0,
    ext: 'mp4',
  };
};

// 获取单个分集信息
export const getVideoPage = async (
  bvid: string,
  name: string,
): Promise<
  Array<
    VideoUrlItems & {
      cid: string;
    }
  >
> => {
  try {
    const {
      data: { code, data },
    } = await rq<{
      code: number;
      data: Array<VideoPageType>;
    }>({
      url: 'https://api.bilibili.com/x/player/pagelist',
      params: {
        bvid,
      },
    });

    if (code === 0 && Array.isArray(data)) {
      const arr: Array<
        VideoUrlItems & {
          cid: string;
        }
      > = [];
      for (const { cid } of data) {
        arr.push({
          bvid,
          cid,
          name,
        });
      }
      return arr;
    }
  } catch (e) {
    console.error(e);
  }

  return [];
};

const includeUid = new Set(INCLUDE_UID_ITEMS);
const excludeUid = new Set(EXCLUDE_UID_ITEMS);

// 获取列表
export const getVideosUrl = async (): Promise<boolean> => {
  try {
    isVip = await getVipStatus();
    const queue = db.get('queue').value() || [];
    const filterSet = new Set(queue.map(({ bvid }) => bvid));

    const {
      data: { code, data, message },
    } = await rq<DynamicNewType>({
      url: 'https://api.vc.bilibili.com/dynamic_svr/v1/dynamic_svr/dynamic_new',
      params: {
        uid: _MY_UID && _MY_UID.groups ? _MY_UID.groups.userId : '',
        type_list: 8,
        from: '',
        platform: 'web',
      },
    });

    if (code === 0 && Array.isArray(data.cards)) {
      const { cards } = data;
      const notes: string[] = db.get('notes').value();
      const timeout =
        Math.floor(Date.now() / 1000) -
        (process.env.NODE_ENV === 'development' ? 600 : 43200);
      let isDownload = false;

      const includeRe = new RegExp(env.BILIBILI_INCLUDE_KW || '', 'img');

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
      } of cards) {
        const { topic_details } = topic_info;
        const userId = uid.toString();

        // 话题中是否有关键词
        const isTopic: number = topic_details.findIndex(({ topic_name }) => {
          return includeRe.test(topic_name);
        });

        // 描述中是否有关键词
        const isCard = includeRe.test(card);

        // 是否是必须包含的用户
        const isIncludeUid = includeUid.has(userId);

        let isNeed =
          // 判断是否符合条件
          (isTopic >= 0 || isCard || isIncludeUid) &&
          // 判断是否需要下载
          timeout < timestamp &&
          !notes.includes(bvid) &&
          !filterSet.has(bvid);

        // 如果需要下载，看是否是排除的UID
        if (isNeed) {
          isNeed = !excludeUid.has(userId);
        }

        // console.log(uname, isTopic, isCard, isIncludeUid, isNeed)
        if (isNeed) {
          isDownload = true;
          await db
            .get<'queue'>('queue')
            .push({
              bvid,
              name: uname,
            })
            .write();
        }
      }

      return isDownload;
    } else {
      logger.error(`错误代码：${code}；错误信息：${message}`);
    }
  } catch (e) {
    console.error(e);
  }

  return false;
};
