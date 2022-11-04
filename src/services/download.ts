/*
 * @Author       : 程哲林
 * @Date         : 2022-11-02 21:47:32
 * @LastEditors  : 程哲林
 * @LastEditTime : 2022-11-04 21:16:34
 * @FilePath     : /bilibili-downloader/src/services/download.ts
 * @Description  : 未添加文件描述
 */
import { BLI_PLAY_URL } from 'src/const';
import { rq } from '../utils/request';
interface PlayUrl {
  from: string;
  result: string;
  message: string;
  quality: number;
  format: string;
  timelength: number;
  accept_format: string;
  accept_description: string[];
  accept_quality: number[];
  video_codecid: number;
  seek_param: string;
  seek_type: string;
  dash: Dash;
  support_formats: Supportformat[];
  high_format?: any;
  last_play_time: number;
  last_play_cid: number;
}

interface Supportformat {
  quality: number;
  format: string;
  new_description: string;
  display_desc: string;
  superscript: string;
  codecs: string[];
}

interface Dash {
  duration: number;
  minBufferTime: number;
  min_buffer_time: number;
  video: Video[];
  audio: Video[];
  dolby?: any;
  flac?: any;
}

interface Video {
  id: number;
  baseUrl: string;
  base_url: string;
  backupUrl: string[];
  backup_url: string[];
  bandwidth: number;
  mimeType: string;
  mime_type: string;
  codecs: string;
  width: number;
  height: number;
  frameRate: string;
  frame_rate: string;
  sar: string;
  startWithSap: number;
  start_with_sap: number;
  SegmentBase: SegmentBase;
  segment_base: Segmentbase;
  codecid: number;
}

interface Segmentbase {
  initialization: string;
  index_range: string;
}

interface SegmentBase {
  Initialization: string;
  indexRange: string;
}
export const getPlayUrl = async (
  bvid: string,
  cid: number,
): Promise<number | PlayUrl> => {
  try {
    const {
      data: { code, data },
    } = await rq<{
      code: number;
      data: PlayUrl;
    }>({
      url: BLI_PLAY_URL,
      params: {
        bvid,
        cid,
        qn: 120,
        fnval: 80,
        fourk: 1,
      },
    });

    if (code === 0) {
      return data;
    } else {
      return code;
    }
  } catch (e) {
    console.error(e);
  }
};
