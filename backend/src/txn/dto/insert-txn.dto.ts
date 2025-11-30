import { IsEnum, IsOptional, IsString, IsBoolean } from 'class-validator';
import { IsolationLevel } from 'src/enums/isolation-level';

export class InsertTxnDto {
  @IsEnum(IsolationLevel)
  isolation: IsolationLevel;

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

  @IsOptional()
  @IsBoolean()
  simReplicationError?: boolean;
}
