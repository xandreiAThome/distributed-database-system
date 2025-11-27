import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ description: 'User ID', required: false })
  @IsNumber()
  @IsOptional()
  @Min(1)
  userId?: number;

  @ApiProperty({ description: 'Username', maxLength: 50 })
  @IsString()
  @Length(1, 50)
  username: string;

  @ApiProperty({ description: 'First name', maxLength: 40 })
  @IsString()
  @Length(1, 40)
  firstName: string;

  @ApiProperty({ description: 'Last name', maxLength: 40 })
  @IsString()
  @Length(1, 40)
  lastName: string;

  @ApiProperty({ description: 'City', maxLength: 50 })
  @IsString()
  @Length(1, 50)
  city: string;

  @ApiProperty({ description: 'Country', maxLength: 100 })
  @IsString()
  @Length(1, 100)
  country: string;

  @ApiProperty({ description: 'Zip code', maxLength: 20 })
  @IsString()
  @Length(1, 20)
  zipcode: string;

  @ApiProperty({ description: 'Gender', maxLength: 6 })
  @IsString()
  @Length(1, 6)
  gender: string;
}
