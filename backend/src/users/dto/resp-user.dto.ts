import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class UserDto {
  @ApiProperty()
  @Expose({ name: 'user_id' })
  user_id: number;

  @ApiProperty()
  @Expose()
  username: string;

  @ApiProperty()
  @Expose()
  first_name: string;

  @ApiProperty()
  @Expose()
  last_name: string;

  @ApiProperty()
  @Expose()
  city: string;

  @ApiProperty()
  @Expose()
  country: string;

  @ApiProperty()
  @Expose()
  zipcode: string;

  @ApiProperty()
  @Expose()
  gender: string;
}
