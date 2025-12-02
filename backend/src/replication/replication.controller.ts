import { Body, Controller, Post } from '@nestjs/common';
import { ReplicationService } from './replication.service';
import { randomUUID } from 'crypto';
import { ReplicationDto } from './dto/replication-payload.dto';
import { MarkOutgoingDto } from './dto/mark-outgoing.dto';

@Controller('replication')
export class ReplicationController {
  constructor(private readonly replicationService: ReplicationService) {}

  @Post('apply')
  async applyReplication(@Body() data: ReplicationDto) {
    const globalTxId = data.globalTxId ?? randomUUID();
    data.globalTxId = globalTxId;
    return this.replicationService.applyIncomingReplication(data);
  }

  @Post('mark-outgoing')
  async markOutgoing(@Body() body: MarkOutgoingDto) {
    const { globalTxId, success } = body;

    await this.replicationService.markOutgoingStatus(globalTxId, success);

    return {
      ok: true,
      globalTxId,
      status: success ? 'APPLIED' : 'PENDING',
    };
  }
}
