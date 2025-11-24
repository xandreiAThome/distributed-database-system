import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min } from 'class-validator';

export class SearchUserDto {
  @ApiPropertyOptional({
    description: 'Limit the number of users returned',
    example: 10,
    minimum: 1,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional({
    description: 'Name of the user to search for',
    example: 'John',
    required: true,
  })
  @IsOptional()
  @IsString()
  name: string;
}
