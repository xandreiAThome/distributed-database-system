import {
  IsArray,
  ValidateNested,
  IsNumber,
  IsString,
} from '@nestjs/class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

// Plain user object that matches database schema (snake_case)
export class PlainUserDto {
  @ApiProperty()
  user_id: number;

  @ApiProperty()
  username: string;

  @ApiProperty()
  first_name: string;

  @ApiProperty()
  last_name: string;

  @ApiProperty()
  city: string;

  @ApiProperty()
  country: string;

  @ApiProperty()
  zipcode: string;

  @ApiProperty()
  gender: string;
}

export class BulkInsertUsersDto {
  @ApiProperty({
    type: [PlainUserDto],
    description: 'Array of users to bulk insert',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlainUserDto)
  users: PlainUserDto[];
}

export class BulkInsertResponseDto {
  @ApiProperty({
    description: 'Number of users inserted',
  })
  count: number;
}
