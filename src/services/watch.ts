/*
 * @Author       : 程哲林
 * @Date         : 2022-11-01 20:46:28
 * @LastEditors  : 程哲林
 * @LastEditTime : 2022-11-02 21:47:40
 * @FilePath     : /bilibili-downloader/src/services/watch.ts
 * @Description  : 未添加文件描述
 */
import { BLI_DYNAMIC_NEW, BLI_VIDEO_PAGE } from 'src/const';
import { rq } from '../utils/request';

export interface VideoUrlItems {
  bvid: string;
  name: string;
  title: string;
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
  cid: number;
  part: string;
}

/**
 * 获取动态列表
 */
export const dynamicList = async (uid: number): Promise<DynamicNewType> => {
  try {
    const { data } = await rq<DynamicNewType>({
      url: BLI_DYNAMIC_NEW,
      params: {
        uid,
        type_list: 8,
        from: '',
        platform: 'web',
      },
    });

    return data;
  } catch (e) {
    console.error(e);
  }
};

export const getVideoCid = async (bvid: string): Promise<VideoPageType[]> => {
  try {
    const {
      data: { code, data },
    } = await rq<{
      code: number;
      data: Array<VideoPageType>;
    }>({
      url: BLI_VIDEO_PAGE,
      params: {
        bvid,
      },
    });

    if (code === 0) {
      return data;
    } else {
      return [];
    }
  } catch (e) {
    console.error(e);
  }
};
