import { Module } from '@nestjs/common';
import { WatchService } from './watch.service';

@Module({
  providers: [WatchService],
})
export class WatchModule {}
