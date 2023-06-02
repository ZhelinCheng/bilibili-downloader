/*
 * @Author       : 程哲林
 * @Date         : 2023-05-30 13:45:33
 * @LastEditors  : 程哲林
 * @LastEditTime : 2023-06-02 23:26:25
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
    // 存储位置
    group: ConfGroup.DOWNLOAD,
    key: 'outputPath',
    value: getDownloadDir(),
    type: DataType.STRING,
  },
  {
    // 存储类型
    group: ConfGroup.DOWNLOAD,
    key: 'storageType',
    value: StorageType.LOCAL,
    type: DataType.STRING,
  },
  {
    // 视频清晰度
    group: ConfGroup.DOWNLOAD,
    key: 'clarity',
    value: VideoClarity['8K'],
    type: DataType.NUMBER,
  },
  {
    // 超期时间限制
    group: ConfGroup.DOWNLOAD,
    key: 'overtimeLimit',
    value: '600',
    type: DataType.NUMBER,
  },
  {
    // 视频时长限制
    group: ConfGroup.DOWNLOAD,
    key: 'durationLimit',
    value: '300',
    type: DataType.NUMBER,
  },
  {
    // 文件命名
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
    // 关键词
    group: ConfGroup.DOWNLOAD,
    key: 'keywords',
    value: '["收藏夹"]',
    type: DataType.ARRAY,
  },
  {
    // 日志长度限制
    group: ConfGroup.UNIVERSAL,
    key: 'logLimit',
    value: '300',
    type: DataType.NUMBER,
  },
];
