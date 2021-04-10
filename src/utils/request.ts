/*
 * @Author       : Zhelin Cheng
 * @Date         : 2021-02-18 21:20:04
 * @LastEditors  : Zhelin Cheng
 * @LastEditTime : 2021-04-10 18:01:42
 * @FilePath     : \bilibili-downloader\src\utils\request.ts
 * @Description  : 未添加文件描述
 */
import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { logger } from './index';
import { env } from './env'

axios.defaults.timeout = 5000;

axios.defaults.headers = {
  'Cookie': env.BILIBILI_COOKIE,
  'Accept': '*/*',
  'referer': 'https://t.bilibili.com/',
  'Accept-Encoding': 'gzip, deflate, br',
  'Connection': 'keep-alive',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.114 Safari/537.36',
};

axios.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  },
);

axios.interceptors.response.use(
  (response: AxiosResponse) => {
    const { status } = response;
    if (status >= 200 || status < 250) {
      return Promise.resolve(response);
    }
    return Promise.reject(response);
  },
  (error: AxiosError) => {
    logger.error(error);
    return Promise.reject(error);
  },
);

export const rq = function <T>(
  config: AxiosRequestConfig,
): Promise<AxiosResponse<T>> {
  return axios(config);
};
