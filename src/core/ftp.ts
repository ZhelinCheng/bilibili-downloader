/*
 * @Author       : Zhelin Cheng
 * @Date         : 2021-02-19 17:09:10
 * @LastEditors  : 程哲林
 * @LastEditTime : 2022-02-03 18:13:01
 * @FilePath     : /bilibili-downloader/src/core/ftp.ts
 * @Description  : 未添加文件描述
 */

import fs from 'fs';
import fse from 'fs-extra';
import { isFtp } from '../const';
import * as FTP from 'basic-ftp';
import { dirname } from 'path';

const localSave = (
  input: NodeJS.ReadStream,
  localPath: string,
): Promise<boolean> => {
  input.pipe(fs.createWriteStream(localPath), { end: true });
  // input.end()
  return new Promise((resolve, reject) => {
    input.on('end', function () {
      resolve(true);
    });

    input.on('error', function (err) {
      reject(err);
    });
  });
};

export const postData = async (
  client: FTP.Client,
  input: NodeJS.ReadStream,
  destPath: string,
  fileName: string,
  localPath: string,
  baseFtpPath: string,
): Promise<boolean> => {
  try {
    if (isFtp) {
      const dirs = destPath.split(/\/|\\/);
      const lastDir = dirs.pop();

      await client.cd(baseFtpPath);
      if (lastDir) {
        await client.ensureDir(lastDir);
      }
      await client.uploadFrom(input, `${destPath}/${fileName}`);
      return true;
    } else {
      fse.ensureDirSync(dirname(localPath));
      const status = await localSave(input, localPath);
      return status;
    }
  } catch (e) {
    console.error(e);
    return false;
  }
};
