import { Module } from '@nestjs/common';
import { TxnController } from './txn.controller';
import { TxnService } from './txn.service';
import { ReplicationModule } from 'src/replication/replication.module';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  controllers: [TxnController],
  providers: [TxnService],
  imports: [ReplicationModule, DatabaseModule],
})
export class TxnModule {}
