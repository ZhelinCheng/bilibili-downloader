/*
 * @Author       : Zhelin Cheng
 * @Date         : 2021-02-19 17:09:10
 * @LastEditors  : Zhelin Cheng
 * @LastEditTime : 2021-04-24 00:19:45
 * @FilePath     : \bilibili-downloader\src\core\ftp.ts
 * @Description  : 未添加文件描述
 */

import fs from 'fs';
import fse from 'fs-extra';
import { isFtp } from '../const';
import PromiseFtp from 'promise-ftp';

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
  ftp: PromiseFtp,
  input: NodeJS.ReadStream,
  destPath: string,
  fileName: string,
  localPath: string,
): Promise<boolean> => {
  try {
    if (isFtp) {
      await ftp.mkdir(destPath, true);
      await ftp.put(input, `${destPath}/${fileName}`);
      return true;
    } else {
      fse.ensureDirSync(localPath.replace(/(\/|\\)\d+-\d+\.(mp4|flv)$/, ''));
      const status = await localSave(input, localPath);
      return status;
    }
  } catch (e) {
    console.error(e);
    return false;
  }
};
