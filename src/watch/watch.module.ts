import { Module } from '@nestjs/common';
import { WatchService } from './watch.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Config } from '../app.entities/config.entity';
import { Queue } from '../app.entities/queue.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Queue, Config])],
  providers: [WatchService],
})
export class WatchModule {}
