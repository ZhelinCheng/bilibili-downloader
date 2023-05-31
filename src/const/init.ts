/*
 * @Author       : 程哲林
 * @Date         : 2023-05-30 13:45:33
 * @LastEditors  : 程哲林
 * @LastEditTime : 2023-05-31 21:36:50
 * @FilePath     : /bilibili-downloader/src/const/init.ts
 * @Description  : 未添加文件描述
 */
import { getDownloadDir } from '@/utils';
import { ConfGroup, DataType, StorageType, VideoClarity } from './index';

export const initBaseConfig = [
  // 下载配置
  {
    group: ConfGroup.USER,
    key: 'cookie',
    value: '',
    type: DataType.STRING,
  },
  {
    group: ConfGroup.USER,
    key: 'refreshToken',
    value: '',
    type: DataType.STRING,
  },
  {
    group: ConfGroup.OVERVIEW,
    key: 'lastUpdate',
    value: '0',
    type: DataType.NUMBER,
  },
  {
    group: ConfGroup.OVERVIEW,
    key: 'lastDownload',
    value: '0',
    type: DataType.NUMBER,
  },
  {
    group: ConfGroup.OVERVIEW,
    key: 'startTime',
    value: '',
    type: DataType.NUMBER,
  },
  {
    group: ConfGroup.OVERVIEW,
    key: 'unfinished',
    value: '0',
    type: DataType.NUMBER,
  },
  {
    group: ConfGroup.OVERVIEW,
    key: 'completed',
    value: '0',
    type: DataType.NUMBER,
  },
  {
    group: ConfGroup.DOWNLOAD,
    key: 'outputPath',
    value: getDownloadDir(),
    type: DataType.STRING,
  },
  {
    group: ConfGroup.DOWNLOAD,
    key: 'storageType',
    value: StorageType.LOCAL,
    type: DataType.STRING,
  },
  {
    group: ConfGroup.DOWNLOAD,
    key: 'clarity',
    value: VideoClarity['8K'],
    type: DataType.NUMBER,
  },
  {
    group: ConfGroup.DOWNLOAD,
    key: 'overtime',
    value: '300',
    type: DataType.NUMBER,
  },
  {
    group: ConfGroup.DOWNLOAD,
    key: 'limit',
    value: '300',
    type: DataType.NUMBER,
  },
  {
    group: ConfGroup.DOWNLOAD,
    key: 'namingType',
    value: '{username}_{filename}_{bvid}_{cid}',
    type: DataType.STRING,
  },
  {
    // 收藏夹
    group: ConfGroup.DOWNLOAD,
    key: 'favorites',
    value: '[]',
    type: DataType.ARRAY,
  },
  {
    // 监听范围
    group: ConfGroup.DOWNLOAD,
    key: 'scope',
    value: '[]',
    type: DataType.ARRAY,
  },
  {
    group: ConfGroup.UNIVERSAL,
    key: 'logLimit',
    value: '300',
    type: DataType.NUMBER,
  },
];
