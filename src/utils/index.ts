import * as fse from 'fs-extra';
import { join } from 'path';
import { getQrCode, userInfo, loginStatus } from 'src/services/login';
import * as qrcode from 'qrcode-terminal';
import { State } from 'src/app.state';

const cookiePath = join(__dirname, '../..', '.cookie.json');

type CookieFile = {
  cookie: string;
  token: string;
};
const baseJson = { cookie: '', token: '' };

export const removeFile = (path: string) => {
  fse.removeSync(path);
};

export const readFile = (path: string): CookieFile => {
  try {
    fse.ensureFileSync(path);
    return fse.readJsonSync(path);
  } catch (e) {
    fse.writeJsonSync(path, baseJson);
    return baseJson;
  }
};

export const writeJsonFile = (data: CookieFile, path?: string) => {
  fse.ensureFileSync(path || cookiePath);
  fse.writeJsonSync(path || cookiePath, data);
};

// 获取cookie
let cookie = '';
setInterval(() => {
  cookie = '';
}, 10 * 1000);
export const readCookie = (): string => {
  if (!cookie) {
    cookie = readFile(cookiePath).cookie;
  }
  return cookie;
};

// 登陆
export function login() {
  return new Promise(async (resolve) => {
    const { status, data } = await userInfo();

    if (status !== 200) {
      console.error(`接口状态错误：${status}`);
      resolve(null);
    } else if (data.code < 0) {
      // 获取二维码登陆
      const qc = await getQrCode();

      if (qc.data.code === 0) {
        const qcData = qc.data.data;

        qrcode.generate(qcData.url, { small: true });
        console.log(`⬆️⬆️⬆️ 请扫码二维码登陆 ⬆️⬆️⬆️`);

        const timer = setInterval(async () => {
          const res = await loginStatus(qcData.qrcode_key);
          const { code, refresh_token, message } = res.data.data;
          if ([0, 86038].includes(code)) {
            clearInterval(timer);
            resolve(null);
          }
          if (code === 0) {
            const setCookie = res.headers['set-cookie'];

            const cookies = setCookie.map((ck: string) => {
              return ck.split(';')[0];
            });

            writeJsonFile({
              cookie: cookies.join(';'),
              token: refresh_token,
            });

            const user = await userInfo();
            State.vipStatus = user.data.data.vip_status > 0;
            State.isLogin = true;
            console.log(
              `登录成功，是否为大会员：${State.vipStatus ? '是' : '否'}`,
            );

            resolve(true);
          } else {
            console.log(message);
          }
        }, 3000);
      }
    } else {
      State.vipStatus = data.data.vip_status > 0;
      State.isLogin = true;
      console.log(`登录成功，是否为大会员：${State.vipStatus ? '是' : '否'}`);

      resolve(true);
    }

    resolve(null);
  });
}

/* export function polling() {
  function

  return new Promise(() => {
    setTimeout(async () => {
      
    }, 1500);
  });
} */
