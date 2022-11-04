import { Config } from './app.entities/config.entity';

/*
 * @Author       : 程哲林
 * @Date         : 2022-11-01 19:29:35
 * @LastEditors  : 程哲林
 * @LastEditTime : 2022-11-04 13:34:30
 * @FilePath     : /bilibili-downloader/src/app.state.ts
 * @Description  : 未添加文件描述
 */
export class State {
  // 是否登录
  static isLogin = false;
  // vip状态
  static vipStatus = false;
  // uid
  static userId = 0;
  // 配置信息
  static cfg: Config;
  // 准备就绪
  static isReady = false;
}
