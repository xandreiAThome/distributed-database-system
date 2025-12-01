import { Body, Controller, Post } from '@nestjs/common';
import { ReplicationService } from './replication.service';
import { randomUUID } from 'crypto';
import { ReplicationDto } from './dto/replication-payload.dto';

@Controller('replication')
export class ReplicationController {
  constructor(private readonly replicationService: ReplicationService) {}

  @Post('apply')
  async applyReplication(@Body() data: ReplicationDto) {
    const globalTxId = data.globalTxId ?? randomUUID();
    data.globalTxId = globalTxId;
    return this.replicationService.applyIncomingReplication(data);
  }
}
