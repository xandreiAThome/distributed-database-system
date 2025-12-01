import { IsolationLevel } from 'src/enums/isolation-level';
import { RepOperationType } from 'src/enums/operation-type';
import {
  IsEnum,
  IsString,
  IsNumber,
  ValidateNested,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

class ReplicationData {
  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  first_name?: string;

  @IsOptional()
  @IsString()
  last_name?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  zipcode?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsString()
  updatedAt: string; // ISO timestamp
}

export class ReplicationDto {
  @IsString()
  globalTxId: string;

  @IsString()
  sourceNode: string;

  @IsString()
  targetNode: string;

  @IsEnum(RepOperationType)
  operation: RepOperationType;

  @IsNumber()
  userPk: number;

  @IsEnum(IsolationLevel)
  isolation: IsolationLevel;

  @ValidateNested()
  @Type(() => ReplicationData)
  payload: ReplicationData;
}
