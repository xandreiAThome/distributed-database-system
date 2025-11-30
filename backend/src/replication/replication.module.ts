import { Module } from '@nestjs/common';
import { ReplicationController } from './replication.controller';
import { ReplicationService } from './replication.service';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  controllers: [ReplicationController],
  providers: [ReplicationService],
  imports: [DatabaseModule],
  exports: [ReplicationService],
})
export class ReplicationModule {}
