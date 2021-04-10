/*
 * @Author       : Zhelin Cheng
 * @Date         : 2021-02-19 17:09:10
 * @LastEditors  : Zhelin Cheng
 * @LastEditTime : 2021-04-10 19:06:10
 * @FilePath     : \bilibili-downloader\src\core\ftp.ts
 * @Description  : 未添加文件描述
 */

import PromiseFtp from 'promise-ftp';

export const postData = async (
  ftp: PromiseFtp,
  input: string | NodeJS.ReadStream,
  destPath: string,
  fileName: string,
): Promise<boolean> => {
  try {
    await ftp.mkdir(destPath, true);
    await ftp.put(input, `${destPath}/${fileName}`);
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
};
