import { Injectable, Logger, Inject } from '@nestjs/common';
import { User } from 'db-schema/user';
import { PartitionService, PartitionNode } from './partition.service';
import { DatabaseAsyncProvider } from 'src/database/database.provider';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from 'db-schema/schema';

export interface SyncResult {
  nodeId: string;
  success: boolean;
  recordsCount: number;
  error?: string;
}

@Injectable()
export class DistributedSyncService {
  private readonly logger = new Logger(DistributedSyncService.name);
  private partitionService: PartitionService;

  constructor(
    @Inject(DatabaseAsyncProvider)
    private db: NodePgDatabase<typeof schema>,
  ) {
    // Initialize partition service with nodes configuration
    this.partitionService = new PartitionService({
      nodes: this.getNodesConfig(),
      partitionKey: 'userId',
    });
  }

  /**
   * Get nodes configuration from environment
   */
  private getNodesConfig(): PartitionNode[] {
    return [
      {
        id: 'master',
        role: 'master',
        port: parseInt(process.env.MASTER_PORT || '3001', 10),
        url: process.env.MASTER_URL || 'http://localhost:3001',
      },
      {
        id: process.env.SLAVE_1_ID || 'slave-1',
        role: 'slave',
        port: parseInt(process.env.SLAVE_1_PORT || '3002', 10),
        url: process.env.SLAVE_1_URL || 'http://localhost:3002',
      },
      {
        id: process.env.SLAVE_2_ID || 'slave-2',
        role: 'slave',
        port: parseInt(process.env.SLAVE_2_PORT || '3003', 10),
        url: process.env.SLAVE_2_URL || 'http://localhost:3003',
      },
    ];
  }

  /**
   * Fetch all users from master database and distribute to slave nodes
   */
  async fetchAndDistributeUsers(): Promise<SyncResult[]> {
    try {
      this.logger.log('Fetching all users from master database');

      // Fetch all users from master database
      const users = await this.db.select().from(schema.dimUsers);

      if (users.length === 0) {
        this.logger.warn('No users found in master database');
        return [];
      }

      this.logger.log(
        `Fetched ${users.length} users from master database. Starting distribution...`,
      );

      // Partition and sync to slaves
      return this.syncToSlaves(users);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to fetch and distribute users: ${errorMsg}`);
      throw error;
    }
  }

  /**
   * Partition users and sync to slave nodes
   */
  private async syncToSlaves(users: User[]): Promise<SyncResult[]> {
    this.logger.log(`Starting distribution of ${users.length} users`);

    // Partition users by userId
    const partitions = this.partitionService.partitionData(
      users,
      (user) => user.userId,
    );

    // Log partition stats
    const stats = this.partitionService.getPartitionStats(partitions);
    this.logger.log(`Partition distribution: ${JSON.stringify(stats)}`);

    // Send partitioned data to each slave node
    const results: SyncResult[] = [];

    for (const [nodeId, nodeUsers] of partitions) {
      const node = this.partitionService
        .getSlaveNodes()
        .find((n) => n.id === nodeId);
      if (node) {
        const result = await this.syncToNode(node, nodeUsers);
        results.push(result);
      }
    }

    return results;
  }

  /**
   * Sync data to a specific node in chunks
   */
  private async syncToNode(
    node: PartitionNode,
    users: User[],
  ): Promise<SyncResult> {
    try {
      this.logger.log(
        `Syncing ${users.length} users to ${node.id} at ${node.url}/partition/bulk-insert`,
      );

      const CHUNK_SIZE = 1000; // Send 1000 users per request
      let totalInserted = 0;

      for (let i = 0; i < users.length; i += CHUNK_SIZE) {
        const chunk = users.slice(i, Math.min(i + CHUNK_SIZE, users.length));
        // Convert camelCase to snake_case for network transmission
        const snakeCaseChunk = chunk.map((user) => ({
          user_id: user.userId,
          username: user.username,
          first_name: user.firstName,
          last_name: user.lastName,
          city: user.city,
          country: user.country,
          zipcode: user.zipcode,
          gender: user.gender,
        }));

        this.logger.log(
          `Sending chunk ${Math.floor(i / CHUNK_SIZE) + 1}/${Math.ceil(users.length / CHUNK_SIZE)} with ${chunk.length} users to ${node.id}`,
        );

        const response = await fetch(`${node.url}/partition/bulk-insert`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ users: snakeCaseChunk }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `HTTP ${response.status}: ${response.statusText} - ${errorText}`,
          );
        }

        const result = (await response.json()) as { count: number };
        totalInserted += result.count || chunk.length;
      }

      this.logger.log(
        `Successfully synced to ${node.id}: ${totalInserted} records`,
      );

      return {
        nodeId: node.id,
        success: true,
        recordsCount: totalInserted,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to sync to ${node.id}: ${errorMsg}`,
        error instanceof Error ? error.stack : '',
      );

      return {
        nodeId: node.id,
        success: false,
        recordsCount: users.length,
        error: errorMsg,
      };
    }
  }

  /**
   * Get which node a user should be stored on
   */
  getNodeForUser(userId: number): PartitionNode {
    return this.partitionService.getTargetNode(userId);
  }

  /**
   * Get partition statistics
   */
  getPartitionService(): PartitionService {
    return this.partitionService;
  }
}
