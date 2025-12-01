// src/recovery/recovery.controller.ts
import { Controller, Post } from '@nestjs/common';
import { RecoveryService } from './recovery.service';

@Controller('recovery')
export class RecoveryController {
  constructor(private readonly recoveryService: RecoveryService) {}

  @Post('run')
  async runRecovery() {
    return this.recoveryService.replayPendingOutgoing();
  }
}
