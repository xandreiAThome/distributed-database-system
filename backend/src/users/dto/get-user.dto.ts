import { IsOptional, IsNumber, Min } from '@nestjs/class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetUsersDto {
  @ApiProperty({ required: false, description: 'Limit number of users' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number;
}
