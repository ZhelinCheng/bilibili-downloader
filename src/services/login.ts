/*
 * @Author       : 程哲林
 * @Date         : 2022-11-01 17:04:13
 * @LastEditors  : 程哲林
 * @LastEditTime : 2022-11-04 14:22:02
 * @FilePath     : /bilibili-downloader/src/services/login.ts
 * @Description  : 未添加文件描述
 */
import { State } from 'src/app.state';
import { BLI_LOGIN_POLL, BLI_QR_CODE, BLI_USER_INFO } from 'src/const';
import { rq } from '../utils/request';

export async function userInfo() {
  const res = await rq<{
    code: number;
    message: string;
    data: any;
  }>({
    url: BLI_USER_INFO,
  });

  if (res.data.code === 0) {
    State.vipStatus = res.data.data.vip_status === 1;
    State.isLogin = true;
    State.userId = res.data.data.mid;
  }

  return res;
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
