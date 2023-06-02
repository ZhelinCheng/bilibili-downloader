/*
 * @Author       : 程哲林
 * @Date         : 2022-11-01 21:22:26
 * @LastEditors  : 程哲林
 * @LastEditTime : 2023-06-03 00:09:01
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

  @Index()
  @Column({
    type: 'int',
    comment: 'UID',
    unsigned: true,
  })
  uid: number;

  @Column({
    type: 'text',
    comment: 'UP昵称',
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
    comment: '副标题',
    length: 64,
    default: '',
  })
  part: string;

  @Column({
    type: 'text',
    comment: '封面',
  })
  cover: string;

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
    comment: '时间',
    unsigned: true,
  })
  createdTime: number;

  @Column({
    type: 'int',
    comment: '时间',
    unsigned: true,
  })
  completeTime: number;

  // 0完成，1等待，2主动添加，4失败
  @Index()
  @Column({
    type: 'int',
    comment: '状态',
    unsigned: true,
    default: 1,
    width: 1,
  })
  status: number;
}
