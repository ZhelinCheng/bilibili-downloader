/*
 * @Author       : 程哲林
 * @Date         : 2022-11-01 21:22:26
 * @LastEditors  : 程哲林
 * @LastEditTime : 2023-06-02 11:14:15
 * @FilePath     : /bilibili-downloader/src/app.entities/list.entity.ts
 * @Description  : 未添加文件描述
 */
import { Entity, Column, PrimaryGeneratedColumn, Index } from 'typeorm';

@Entity('list')
export class List {
  @PrimaryGeneratedColumn({
    unsigned: true,
  })
  id: number;

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
    comment: '头像',
  })
  avatar: string;

  @Column({
    type: 'int',
    comment: '添加时间',
    unsigned: true,
  })
  createdTime: number;

  // 0黑名单，1白名单
  @Index()
  @Column({
    type: 'int',
    comment: '状态',
    unsigned: true,
    default: 0,
    width: 1,
  })
  status: number;
}
