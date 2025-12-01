import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { DatabaseModule } from './database/database.module';
import { ConfigModule } from '@nestjs/config';
import { CoordinatorModule } from './coordinator/coordinator.module';
import { ReplicationModule } from './replication/replication.module';
import { TxnModule } from './txn/txn.module';
import { RecoveryModule } from './recovery/recovery.module';
import { PartitionModule } from './partition/partition.module';

@Module({
  imports: [
    UsersModule,
    DatabaseModule,
    ConfigModule.forRoot({ isGlobal: true }),
    CoordinatorModule,
    ReplicationModule,
    TxnModule,
    RecoveryModule,
    PartitionModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
