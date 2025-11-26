import { Controller, Post, Body, Logger, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DistributedSyncService, SyncResult } from './distributed-sync.service';
import { BulkInsertResponseDto } from './dto/partition.dto';
import { SyncResultDto } from './dto/sync-result.dto';
import { UsersService } from 'src/users/users.service';

@ApiTags('partition')
@Controller('partition')
export class PartitionController {
  private readonly logger = new Logger(PartitionController.name);

  constructor(
    private readonly syncService: DistributedSyncService,
    private readonly usersService: UsersService,
  ) {}

  @Post('fetch-and-distribute')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Fetch users from master DB and distribute to slaves',
    description:
      'Fetches all users from the master database and partitions them using modulo hashing to slave nodes',
  })
  @ApiResponse({
    status: 200,
    description: 'Users fetched and distributed successfully',
    type: [SyncResultDto],
  })
  @ApiResponse({
    status: 500,
    description: 'Failed to fetch or distribute users',
  })
  async fetchAndDistributeUsers(): Promise<SyncResult[]> {
    this.logger.log('Received request to fetch and distribute users');
    return this.syncService.fetchAndDistributeUsers();
  }

  @Post('bulk-insert')
  @HttpCode(201)
  @ApiOperation({
    summary: 'Bulk insert users',
    description: 'Endpoint for slave nodes to receive partitioned data',
  })
  @ApiResponse({
    status: 201,
    description: 'Users inserted successfully',
    type: BulkInsertResponseDto,
  })
  async bulkInsert(
    @Body() rawBody: { users?: Array<Record<string, string | number>> },
  ): Promise<BulkInsertResponseDto> {
    // Bypass validation for this endpoint to allow snake_case from network
    const users = (rawBody.users as Record<string, string | number>[]) || [];
    this.logger.log(`Bulk insert received: ${users.length} users`);
    const count = await this.usersService.bulkInsertUsers(users);
    this.logger.log(`Successfully inserted ${count} users into local database`);
    return { count };
  }
}
