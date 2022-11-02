/*
 * @Author       : 程哲林
 * @Date         : 2022-11-01 21:22:26
 * @LastEditors  : 程哲林
 * @LastEditTime : 2022-11-01 21:46:01
 * @FilePath     : /bilibili-downloader/src/app.entities/queue.entity.ts
 * @Description  : 未添加文件描述
 */
import { Entity, Column, PrimaryGeneratedColumn, Index } from 'typeorm';

@Entity('queue')
export class Queue {
  @PrimaryGeneratedColumn({
    unsigned: true,
  })
  id: number;

  @Column({
    type: 'text',
    comment: '用户昵称',
    length: 64,
  })
  name: string;

  @Column({
    type: 'text',
    comment: '标题',
    length: 64,
  })
  title: string;

  @Column({
    type: 'text',
    comment: 'BVID',
    length: 13,
  })
  bvid: string;

  @Index()
  @Column({
    type: 'int',
    comment: 'CID',
    unsigned: true,
  })
  cid: number;

  @Column({
    type: 'int',
    comment: 'BVID',
    unsigned: true,
  })
  uid: number;

  @Column({
    type: 'int',
    comment: '时间',
    unsigned: true,
  })
  timestamp: number;

  // 0等待，1完成，2失败
  @Column({
    type: 'int',
    comment: '状态',
    unsigned: true,
    default: 0,
  })
  status: number;
}
