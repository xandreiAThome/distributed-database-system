import {
  Patch,
  Delete,
  Body,
  Post,
  Controller,
  Get,
  Query,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserDto } from './dto/resp-user.dto';
import { GetAllUsersDto } from './dto/get-all-users.dto';
import { SearchUserDto } from './dto/search-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

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
  getAllUsers(@Query() query: GetAllUsersDto) {
    return this.userService.getAllUsers(query.limit);
  }

  @Get('/search')
  @ApiOperation({
    summary: 'Search users by name',
    description:
      'Retrieves users whose first or last name matches the search query (supports partial/fuzzy matching)',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved matching users',
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
  getUsersByName(@Query() query: SearchUserDto) {
    return this.userService.getUsersByName(query.name, query.limit);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get user by ID',
    description: 'Retrieves a user by their unique ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved user',
    type: UserDto,
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  getUserById(@Param('id', ParseIntPipe) id: number) {
    return this.userService.getUserById(id);
  }

  /*
    @Post()
  @ApiOperation({
    summary: 'Create a new user',
    description: 'Creates a new user with the provided details',
  })
  @ApiResponse({
    status: 201,
    description: 'User successfully created',
    type: UserDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request body',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  createUser(@Body() createUserDto: CreateUserDto) {
    return this.userService.createUser(createUserDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete user by ID',
    description: 'Deletes a user by their unique ID',
  })
  @ApiResponse({
    status: 200,
    description: 'User successfully deleted',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  deleteUser(@Param('id', ParseIntPipe) id: number) {
    return this.userService.deleteUser(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update user by ID',
    description: 'Updates user fields by their unique ID',
  })
  @ApiResponse({
    status: 200,
    description: 'User successfully updated',
    type: UserDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request body or parameters',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.userService.updateUser(id, updateUserDto);
  }
    */
}
