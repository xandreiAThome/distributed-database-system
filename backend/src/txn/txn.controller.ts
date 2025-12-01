// src/txn/txn.controller.ts
import { Body, Controller, Post } from '@nestjs/common';
import { TxnService } from './txn.service';
import { ScriptedTxnDto } from './dto/scripted-txn.dto';
import { InsertTxnDto } from './dto/insert-txn.dto';

@Controller('txn')
export class TxnController {
  constructor(private readonly txnService: TxnService) {}

  @Post('scripted')
  async runScripted(@Body() body: ScriptedTxnDto) {
    return this.txnService.runScriptedTxn(body);
  }

  // Insert with auto generated primary key using central
  @Post('insert-auto')
  async autoInsert(@Body() body: InsertTxnDto) {
    return this.txnService.performInsertTxn(body);
  }

  /*

  // Allocate id (Only central node can perform this)
  @Post('id/allocate')
  async allocateUserId() {
    return this.txnService.allocateUserId();
  }
*/
}
