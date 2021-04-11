/*
 * @Author       : Zhelin Cheng
 * @Date         : 2021-04-10 17:35:02
 * @LastEditors  : Zhelin Cheng
 * @LastEditTime : 2021-04-11 13:01:32
 * @FilePath     : \bilibili-downloader\src\core\url.ts
 * @Description  : 未添加文件描述
 */
import { rq, env, db } from '../utils';

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
  }>;
}

// 获取单个分集信息
export const getVideoDownloadUrl = async (
  bvid: string,
  cid: string,
): Promise<string> => {
  try {
    const {
      data: { code, data },
    } = await rq<{
      code: number;
      data: VideoDownloadUrl;
    }>({
      url: 'https://api.bilibili.com/x/player/playurl',
      params: {
        bvid,
        cid,
        qn: 120,
        fourk: 1,
      },
    });

    if (code === 0 && data && Array.isArray(data.durl)) {
      const { url } = data.durl[0];
      return url;
    }
  } catch (e) {
    console.error(e);
  }

  return '';
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

// 获取列表
export const getVideosUrl = async (): Promise<boolean> => {
  try {
    const {
      data: { code, data },
    } = await rq<DynamicNewType>({
      url: 'https://api.vc.bilibili.com/dynamic_svr/v1/dynamic_svr/dynamic_new',
      params: {
        uid: env.BILIBILI_UID,
        type_list: 8,
        from: '',
        platform: 'web',
      },
    });

    if (code === 0 && Array.isArray(data.cards)) {
      const { cards } = data;
      const notes: string[] = db.get('notes').value();
      const timeout = Math.floor(Date.now() / 1000) - 600;
      let isDownload = false;
      for (const {
        display: {
          topic_info = {
            topic_details: [],
          },
        },
        card = '',
        desc: {
          bvid,
          timestamp,
          user_profile: {
            info: { uname },
          },
        },
      } of cards) {
        const { topic_details } = topic_info;

        let isDance: number | boolean = topic_details.findIndex(
          ({ topic_name }) => {
            return /星辰|姐姐|妹妹|舞/.test(topic_name);
          },
        );

        isDance =
          (isDance >= 0 || /舞/gm.test(card)) &&
          timeout < timestamp &&
          !notes.includes(bvid);

        if (isDance) {
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
    }
  } catch (e) {
    console.error(e);
  }

  return false;
};
