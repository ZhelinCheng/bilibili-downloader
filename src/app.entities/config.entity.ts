/*
 * @Author       : 程哲林
 * @Date         : 2022-11-01 15:07:48
 * @LastEditors  : 程哲林
 * @LastEditTime : 2023-05-30 13:46:59
 * @FilePath     : /bilibili-downloader/src/app.entities/config.entity.ts
 * @Description  : 未添加文件描述
 */
import { ConfGroup, DataType } from '@/const';
import { Entity, Column, PrimaryGeneratedColumn, Index } from 'typeorm';

@Entity('config')
export class Config {
  @PrimaryGeneratedColumn({
    unsigned: true,
  })
  id: number;

  @Index()
  @Column({
    type: 'simple-enum',
    enum: ConfGroup,
    default: ConfGroup.UNIVERSAL,
    comment: '配置所属组',
  })
  group: ConfGroup;

  @Column({
    type: 'text',
    comment: 'key',
    default: '',
    length: 50,
  })
  key: string;

  @Column({
    type: 'text',
    comment: 'value',
    default: '',
  })
  value: string;

  @Column({
    type: 'simple-enum',
    enum: DataType,
    comment: 'type数据类型',
    default: DataType.STRING,
  })
  type: DataType;
}
