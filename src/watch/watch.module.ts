import { Module } from '@nestjs/common';
import { WatchService } from './watch.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Config } from '../app.entities/config.entity';
import { Queue } from '../app.entities/queue.entity';
import { List } from '../app.entities/list.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Queue, Config, List])],
  providers: [WatchService],
})
export class WatchModule {}
