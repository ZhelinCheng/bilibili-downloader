/*
 * @Author       : 程哲林
 * @Date         : 2022-11-01 15:07:48
 * @LastEditors  : 程哲林
 * @LastEditTime : 2022-11-02 21:29:41
 * @FilePath     : /bilibili-downloader/src/app.entities/config.entity.ts
 * @Description  : 未添加文件描述
 */
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('config')
export class Config {
  @PrimaryGeneratedColumn({
    unsigned: true,
  })
  id: number;

  @Column({
    type: 'int',
    comment: '视频时长, 300秒',
    default: 300,
  })
  duration: number;

  @Column({
    type: 'int',
    comment: '动态超期时间',
    default: 600,
  })
  expire: number;

  @Column({
    type: 'text',
    comment: '排除uid集合',
    default: '',
  })
  exclude: string;

  @Column({
    type: 'text',
    comment: '关键词',
    default: '',
  })
  keywords: string;
}
