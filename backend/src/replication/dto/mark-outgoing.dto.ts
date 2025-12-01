import { IsString, IsBoolean } from 'class-validator';

export class MarkOutgoingDto {
  @IsString()
  globalTxId: string;

  @IsBoolean()
  success: boolean;
}
