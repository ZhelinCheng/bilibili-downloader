/*
 * @Author       : 程哲林
 * @Date         : 2023-05-30 10:45:51
 * @LastEditors  : 程哲林
 * @LastEditTime : 2023-05-30 10:48:26
 * @FilePath     : /bilibili-downloader/src/app.dto/query.dto.ts
 * @Description  : 未添加文件描述
 */

import { ConfGroup } from '@/const';
import { IsEnum } from 'class-validator';

export class ConfQueryDto {
  @IsEnum(ConfGroup)
  readonly group: ConfGroup;
}
