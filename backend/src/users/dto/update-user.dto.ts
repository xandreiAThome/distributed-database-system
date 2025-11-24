import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, Length, IsOptional } from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({ description: 'Username', maxLength: 50 })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  username?: string;

  @ApiPropertyOptional({ description: 'First name', maxLength: 40 })
  @IsOptional()
  @IsString()
  @Length(1, 40)
  firstName?: string;

  @ApiPropertyOptional({ description: 'Last name', maxLength: 40 })
  @IsOptional()
  @IsString()
  @Length(1, 40)
  lastName?: string;

  @ApiPropertyOptional({ description: 'City', maxLength: 50 })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  city?: string;

  @ApiPropertyOptional({ description: 'Country', maxLength: 100 })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  country?: string;

  @ApiPropertyOptional({ description: 'Zip code', maxLength: 20 })
  @IsOptional()
  @IsString()
  @Length(1, 20)
  zipcode?: string;

  @ApiPropertyOptional({ description: 'Gender', maxLength: 6 })
  @IsOptional()
  @IsString()
  @Length(1, 6)
  gender?: string;
}
