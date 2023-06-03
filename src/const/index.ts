/*
 * @Author       : 程哲林
 * @Date         : 2022-11-01 16:27:07
 * @LastEditors  : 程哲林
 * @LastEditTime : 2023-06-03 17:18:06
 * @FilePath     : /bilibili-downloader/src/const/index.ts
 * @Description  : 未添加文件描述
 */

// 获取用户信息
export const BLI_USER_INFO = 'https://api.bilibili.com/x/vip/web/user/info';

// 获取登陆二维码
export const BLI_QR_CODE =
  'http://passport.bilibili.com/x/passport-login/web/qrcode/generate';

// 登陆轮训
export const BLI_LOGIN_POLL =
  'http://passport.bilibili.com/x/passport-login/web/qrcode/poll';

// 动态列表
export const BLI_DYNAMIC_NEW =
  'https://api.vc.bilibili.com/dynamic_svr/v1/dynamic_svr/dynamic_new';

// 视频分集
export const BLI_VIDEO_PAGE = 'https://api.bilibili.com/x/player/pagelist';

// 视频下载地址
export const BLI_PLAY_URL = 'http://api.bilibili.com/x/player/playurl';

// 检查Cookie是否需要刷新
export const BLI_CHECK_REFRESH =
  'https://passport.bilibili.com/x/passport-login/web/cookie/info';

export const BLI_REFRESH_COOKIE =
  'https://passport.bilibili.com/x/passport-login/web/cookie/infohttps://passport.bilibili.com/x/passport-login/web/cookie/refresh';

export enum ConfGroup {
  // 展示设置
  OVERVIEW = 'overview',
  // 用户配置
  USER = 'user',
  // 黑白名单
  LIST = 'list',
  // 下载设置
  DOWNLOAD = 'download',
  // 通用设置
  UNIVERSAL = 'universal',
}

export enum StorageType {
  LOCAL = 'local',
  FTP = 'ftp',
  WEBDAV = 'webdav',
}

export enum DataType {
  NUMBER = 'number',
  STRING = 'string',
  ARRAY = 'array',
  OBJECT = 'object',
  BOOLEAN = 'boolean',
}

export enum VideoClarity {
  '240P' = '6',
  '360P' = '16',
  '480P' = '32',
  '720P' = '64',
  '720P60' = '74',
  '1080P' = '80',
  '1080P+' = '112',
  '1080P60' = '116',
  '4K' = '120',
  HDR = '125',
  DOLBY = '126',
  '8K' = '127',
}

export enum ClarityType {
  '4K' = '4k',
  '8K' = '8k',
  '1080P' = '1080p',
}
