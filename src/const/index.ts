/*
 * @Author       : 程哲林
 * @Date         : 2022-11-01 16:27:07
 * @LastEditors  : 程哲林
 * @LastEditTime : 2023-05-19 18:07:50
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
