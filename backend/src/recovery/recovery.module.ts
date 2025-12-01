import { Module } from '@nestjs/common';
import { RecoveryController } from './recovery.controller';
import { RecoveryService } from './recovery.service';
import { DatabaseModule } from 'src/database/database.module';
import { ReplicationModule } from 'src/replication/replication.module';

@Module({
  controllers: [RecoveryController],
  providers: [RecoveryService],
  imports: [DatabaseModule, ReplicationModule],
})
export class RecoveryModule {}
