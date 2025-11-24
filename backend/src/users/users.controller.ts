import { Controller, Get, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserDto } from './dto/resp-user.dto';
import { GetUsersDto } from './dto/get-user.dto';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all users',
    description: 'Retrieves all users with optional pagination limit',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved all users',
    type: [UserDto],
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid query parameters',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  getAllUsers(@Query() query: GetUsersDto) {
    return this.userService.getAllUsers(query.limit);
  }
}
