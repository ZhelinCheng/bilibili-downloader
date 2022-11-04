import axios, {
  AxiosError,
  AxiosRequestConfig,
  AxiosResponse,
  AxiosPromise,
} from 'axios';
import { State } from 'src/app.state';
import { readCookie } from '.';

axios.defaults.timeout = 5000;

axios.defaults.headers.common = {
  Accept: '*/*',
  referer: 'https://t.bilibili.com/',
  Connection: 'keep-alive',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.114 Safari/537.36',
};

axios.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    config.headers.cookie = readCookie();
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  },
);

axios.interceptors.response.use(
  (response: AxiosResponse) => {
    const { status } = response;
    if (status >= 200 || status < 300) {
      if (response.data.code !== 0) {
        console.error('登录过期，请到管理页面登录');
        State.isLogin = false;
      }
      return Promise.resolve(response);
    }
    return Promise.reject(response);
  },
  (error: AxiosError) => {
    console.error(error);
    return Promise.reject(error);
  },
);

export const rq = function <T>(config: AxiosRequestConfig): AxiosPromise<T> {
  return axios(config) as AxiosPromise<T>;
};
