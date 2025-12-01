import { Module } from '@nestjs/common';
import { PartitionService } from './partition.service';
import { DistributedSyncService } from './distributed-sync.service';
import { PartitionController } from './partition.controller';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [PartitionService, DistributedSyncService],
  controllers: [PartitionController],
  exports: [PartitionService, DistributedSyncService],
})
export class PartitionModule {}
