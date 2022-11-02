/*
 * @Author       : 程哲林
 * @Date         : 2022-11-01 15:07:48
 * @LastEditors  : 程哲林
 * @LastEditTime : 2022-11-01 21:45:03
 * @FilePath     : /bilibili-downloader/src/app.entities/config.entity.ts
 * @Description  : 未添加文件描述
 */
import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('config')
export class Config {
  @PrimaryColumn({
    type: 'text',
    comment: '配置项',
  })
  key: string;

  @Column({
    type: 'text',
    comment: '配置值',
  })
  value: string;
}
