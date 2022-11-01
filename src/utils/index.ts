import * as fse from 'fs-extra';
import { join } from 'path';
import { getQrCode, userInfo } from 'src/services/login';

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
export async function login() {
  const { status, data } = await userInfo();

  if (status !== 200) {
    console.error(`接口状态错误：${status}`);
    return null;
  }

  if (data.code < 0) {
    // 获取二维码登陆
    const qrcode = await getQrCode();

    if (qrcode.data.code === 0) {
      return {
        ...qrcode.data.data,
        is_login: false,
      };
    }
  } else {
    return {
      is_login: true,
      ...data.data,
    };
  }

  return null;
}

/* export function polling() {
  function

  return new Promise(() => {
    setTimeout(async () => {
      
    }, 1500);
  });
} */
