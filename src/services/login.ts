/*
 * @Author       : 程哲林
 * @Date         : 2022-11-01 17:04:13
 * @LastEditors  : 程哲林
 * @LastEditTime : 2023-05-31 21:27:28
 * @FilePath     : /bilibili-downloader/src/services/login.ts
 * @Description  : 未添加文件描述
 */
import { State } from 'src/app.state';
import {
  BLI_CHECK_REFRESH,
  BLI_LOGIN_POLL,
  BLI_QR_CODE,
  BLI_REFRESH_COOKIE,
  BLI_USER_INFO,
} from 'src/const';
import { rq } from '../utils/request';
import QS from 'qs';
import { CacheManager } from '@/utils/cache';

interface UserInfo {
  code: number;
  message: string;
  ttl: number;
  data: Data;
}

interface Data {
  mid: number;
  vip_type: number;
  vip_status: number;
  vip_due_date: number;
  vip_pay_type: number;
  theme_type: number;
  label: Record<string, string>;
  avatar_subscript: number;
  avatar_subscript_url: string;
  nickname_color: string;
  is_new_user: boolean;
  // tip_material?: any;
}

const cm = new CacheManager<UserInfo>(60 * 10000);

export async function userInfo(refresh?: boolean) {
  const memo = cm.get();
  if (memo && !refresh) {
    return memo;
  }

  const res = await rq<UserInfo>({
    url: BLI_USER_INFO,
  });

  if (res.data.code === 0) {
    State.vipStatus = res.data.data.vip_status === 1;
    State.isLogin = true;
    State.userId = res.data.data.mid;

    cm.set(res.data);
  } else {
    cm.clear();
    State.isLogin = false;
  }

  return res.data;
}

export async function getQrCode() {
  return await rq<{
    code: number;
    message: string;
    data: {
      url: string;
      qrcode_key: string;
    };
  }>({
    url: BLI_QR_CODE,
  });
}

export async function loginStatus(qrcodeKey: string) {
  if (!qrcodeKey) {
    return;
  }

  return await rq<{
    code: number;
    message: string;
    data: {
      url: string;
      refresh_token: string;
      timestamp: number;
      code: 0 | 86038 | 86090 | 86101;
      message: string;
    };
  }>({
    params: {
      qrcode_key: qrcodeKey,
    },
    url: BLI_LOGIN_POLL,
  });
}

export async function checkRefresh() {
  return await rq<{
    code: number;
    message: string;
    data: {
      refresh: boolean;
      timestamp: number;
    };
  }>({
    url: BLI_CHECK_REFRESH,
  });
}

export async function getCorrespondHtml(url: string) {
  return await rq<string>({
    url,
  });
}

export async function cookieRefresh(data: Record<string, string>) {
  return await rq<{
    code: number;
    message: string;
    data: {
      code: number;
      message: string;
      refresh_token: string;
    };
  }>({
    method: 'post',
    url: BLI_REFRESH_COOKIE,
    data: QS.stringify(data),
  });
}
