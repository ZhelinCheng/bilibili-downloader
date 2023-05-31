import * as fse from 'fs-extra';
import { join } from 'path';
import { getQrCode, userInfo, loginStatus } from 'src/services/login';
import * as qrcode from 'qrcode-terminal';
import * as crypto from 'crypto';
import { State } from 'src/app.state';
import * as os from 'os';
import { DataSource } from 'typeorm';
import { Config } from '@/app.entities/config.entity';
import { Queue } from '@/app.entities/queue.entity';

export const cookiePath = join(__dirname, '../..', '.cookie.json');

type CookieFile = {
  cookie: string;
  token: string;
  cookieJson: Record<string, string>;
};
const baseJson = { cookie: '', token: '', cookieJson: {} };

// 获取系统默认下载目录
export function getDownloadDir() {
  const downloadPath = join(os.homedir(), 'Downloads');
  return downloadPath;
}

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
/* export function login() {
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
            const cookieJson: Record<string, string> = {};

            const cookies = setCookie.map((ck: string) => {
              const ckItem = ck.split(';')[0];
              const kv = ckItem.split('=');
              cookieJson[kv[0]] = kv[1];
              return ckItem;
            });

            writeJsonFile({
              cookie: cookies.join(';'),
              token: refresh_token,
              cookieJson,
            });

            await userInfo();
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
      State.vipStatus = data.data.vip_status === 1;
      State.isLogin = true;
      State.userId = data.data.mid;
      console.log(`登录成功，是否为大会员：${State.vipStatus ? '是' : '否'}`);

      resolve(true);
    }

    resolve(null);
  });
} */

/**
 * 获取刷新Token的path
 * @param timestamp 时间戳
 * @returns path
 */
export function getCorrespondPath(timestamp: number) {
  const jwk = {
    kty: 'RSA',
    n: 'y4HdjgJHBlbaBN04VERG4qNBIFHP6a3GozCl75AihQloSWCXC5HDNgyinEnhaQ_4-gaMud_GF50elYXLlCToR9se9Z8z433U3KjM-3Yx7ptKkmQNAMggQwAVKgq3zYAoidNEWuxpkY_mAitTSRLnsJW-NCTa0bqBFF6Wm1MxgfE',
    e: 'AQAB',
  };

  const publicKey = crypto.createPublicKey({
    key: jwk,
    format: 'jwk',
    type: 'spki',
  });

  const data = new TextEncoder().encode(`refresh_${timestamp}`);
  const encrypted = new Uint8Array(
    crypto.publicEncrypt(
      { key: publicKey, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING },
      data,
    ),
  );

  return Buffer.from(encrypted).toString('hex');
}

export async function dbUpdate(
  dataSource: DataSource,
  table: any,
  data: any[],
): Promise<boolean> {
  let count = data.length;

  try {
    await dataSource.transaction(async (transactionalEntityManager) => {
      while (count--) {
        const item = data[count];
        await transactionalEntityManager
          .createQueryBuilder()
          .update(table)
          .set(item.update)
          .where(item.where)
          .execute();
      }
    });
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
}

/* export function polling() {
  function

  return new Promise(() => {
    setTimeout(async () => {
      
    }, 1500);
  });
} */
