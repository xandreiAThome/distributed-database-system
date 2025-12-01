import { Controller, Post, Body, Get, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DistributedSyncService, SyncResult } from './distributed-sync.service';
import { User } from 'db-schema/user';

@ApiTags('partition')
@Controller('partition')
export class PartitionController {
  private readonly logger = new Logger(PartitionController.name);
  private nodeRole: string;

  constructor(private readonly syncService: DistributedSyncService) {
    this.nodeRole = process.env.NODE_ROLE ?? 'FRAGMENT';
  }

  /**
   * Bulk insert users into fragment node database
   * Called by central node to insert partitioned data
   */
  @Post('bulk-insert')
  @ApiOperation({
    summary: 'Bulk insert users',
    description:
      'Receives partitioned users from central node and inserts them into fragment database',
  })
  @ApiResponse({
    status: 200,
    description: 'Users successfully inserted',
    schema: {
      example: { count: 500 },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request body',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async bulkInsertUsers(
    @Body() body: { users: User[] },
  ): Promise<{ count: number }> {
    try {
      const { users } = body;

      if (!Array.isArray(users) || users.length === 0) {
        this.logger.warn('Received empty or invalid users array');
        return { count: 0 };
      }

      this.logger.log(`Received ${users.length} users for bulk insert`);

      // Insert users into database via service
      const insertedCount = await this.syncService.bulkInsertUsers(users);

      this.logger.log(`Successfully inserted ${insertedCount} users`);

      return { count: insertedCount };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Bulk insert failed: ${errorMsg}`,
        error instanceof Error ? error.stack : '',
      );
      throw error;
    }
  }

  /**
   * Trigger distribution from central node to fragments
   * Should only be called on the CENTRAL node
   */
  @Post('distribute')
  @ApiOperation({
    summary:
      'Distribute users from central to fragments. Run only once on fresh DB',
    description:
      'Central node fetches all users and distributes them to fragment nodes based on user_id parity',
  })
  @ApiResponse({
    status: 200,
    description: 'Distribution completed',
    schema: {
      example: [
        { nodeId: 'node2', success: true, recordsCount: 500 },
        { nodeId: 'node3', success: true, recordsCount: 500 },
      ],
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Only CENTRAL node can distribute',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async distributeUsers(): Promise<SyncResult[]> {
    if (this.nodeRole !== 'CENTRAL') {
      throw new Error('Distribution can only be called on CENTRAL node');
    }

    return this.syncService.fetchAndDistributeUsers();
  }

  /**
   * Get partition statistics
   */
  @Get('stats')
  @ApiOperation({
    summary: 'Get partition statistics',
    description:
      'Returns information about how users are partitioned across nodes',
  })
  @ApiResponse({
    status: 200,
    description: 'Partition statistics',
    schema: {
      example: {
        evenNode: { id: 'node2', role: 'FRAGMENT', userCount: 500 },
        oddNode: { id: 'node3', role: 'FRAGMENT', userCount: 500 },
      },
    },
  })
  getPartitionStats(): Record<string, unknown> {
    const partitionService = this.syncService.getPartitionService();

    return {
      centralNode: partitionService.getCentralNode(),
      fragmentNodes: partitionService.getFragmentNodes(),
      partitionRule: 'user_id % 2 === 0 ? node2 : node3',
    };
  }
}
