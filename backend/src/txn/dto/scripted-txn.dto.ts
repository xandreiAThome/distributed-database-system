import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsArray,
} from 'class-validator';
import { IsolationLevel } from 'src/enums/isolation-level';
import { TxnStep } from '../interfaces/scripted-txn.interface';

export class ScriptedTxnDto {
  @IsEnum(IsolationLevel)
  isolation: IsolationLevel;

  @IsNumber()
  userId: number;

  @IsOptional()
  @IsBoolean()
  simReplicationError?: boolean;

  @IsArray()
  steps: TxnStep[];
}
