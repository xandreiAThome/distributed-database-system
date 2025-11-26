import {
  IsArray,
  ValidateNested,
  IsNumber,
  IsString,
  IsNotEmpty,
  Min,
} from '@nestjs/class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

// User object with camelCase (matches database schema property names)
export class PlainUserDto {
  @ApiProperty({ description: 'User ID' })
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  userId: number;

  @ApiProperty({ description: 'Username' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ description: 'First name' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ description: 'Last name' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ description: 'City' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ description: 'Country' })
  @IsString()
  @IsNotEmpty()
  country: string;

  @ApiProperty({ description: 'Zipcode' })
  @IsString()
  @IsNotEmpty()
  zipcode: string;

  @ApiProperty({ description: 'Gender' })
  @IsString()
  @IsNotEmpty()
  gender: string;
}

export class BulkInsertUsersDto {
  @ApiProperty({
    type: [PlainUserDto],
    description: 'Array of users to bulk insert',
  })
  @IsArray()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => PlainUserDto)
  users: PlainUserDto[];
}

export class BulkInsertResponseDto {
  @ApiProperty({
    description: 'Number of users inserted',
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  count: number;
}
