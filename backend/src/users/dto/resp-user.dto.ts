import { ApiProperty } from '@nestjs/swagger';

export class UserDto {
  @ApiProperty()
  userId: number;

  @ApiProperty()
  username: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  city: string;

  @ApiProperty()
  country: string;

  @ApiProperty()
  zipcode: string;

  @ApiProperty()
  gender: string;
}
