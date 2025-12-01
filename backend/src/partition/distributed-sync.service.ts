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

/**
 * Distributed sync service for the CENTRAL node to distribute rows to FRAGMENT nodes
 * Fetches all users from central database and distributes them to fragment nodes
 * based on user_id parity:
 * - Even user_ids → EVEN_NODE (node2)
 * - Odd user_ids → ODD_NODE (node3)
 */
@Injectable()
export class DistributedSyncService {
  private readonly logger = new Logger(DistributedSyncService.name);
  private partitionService: PartitionService;
  private nodeRole: string;
  private nodeName: string;

  constructor(
    @Inject(DatabaseAsyncProvider)
    private db: NodePgDatabase<typeof schema>,
  ) {
    this.partitionService = new PartitionService();
    this.nodeRole = process.env.NODE_ROLE ?? 'FRAGMENT';
    this.nodeName = process.env.NODE_NAME ?? 'node1';
  }

  /**
   * Fetch all users from central database and distribute to fragment nodes
   * This should only be called on the CENTRAL node
   */
  async fetchAndDistributeUsers(): Promise<SyncResult[]> {
    // Only central node can distribute
    if (this.nodeRole !== 'CENTRAL') {
      this.logger.warn(
        `fetchAndDistributeUsers called on ${this.nodeName} (role: ${this.nodeRole}). Only CENTRAL node should call this.`,
      );
      return [];
    }

    try {
      this.logger.log('Fetching all users from central database');

      // Fetch all users from central database
      const users = await this.db.select().from(schema.users);

      if (users.length === 0) {
        this.logger.warn('No users found in central database');
        return [];
      }

      this.logger.log(
        `Fetched ${users.length} users from central database. Starting distribution to fragments...`,
      );

      // Partition and sync to fragments
      return this.syncToFragments(users);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to fetch and distribute users: ${errorMsg}`,
        error instanceof Error ? error.stack : '',
      );
      throw error;
    }
  }

  /**
   * Partition users and sync to fragment nodes
   */
  private async syncToFragments(users: User[]): Promise<SyncResult[]> {
    this.logger.log(
      `Starting distribution of ${users.length} users to fragments`,
    );

    // Partition users by user_id parity
    const partitions = this.partitionService.partitionUsers(users);

    // Log partition stats
    const stats = this.partitionService.getPartitionStats(partitions);
    this.logger.log(
      `Partition distribution: ${JSON.stringify(stats)} (even users → node2, odd users → node3)`,
    );

    // Send partitioned data to each fragment node
    const results: SyncResult[] = [];

    for (const fragmentNode of this.partitionService.getFragmentNodes()) {
      const nodeUsers = partitions.get(fragmentNode.id) || [];

      if (nodeUsers.length > 0) {
        const result = await this.syncToNode(fragmentNode, nodeUsers);
        results.push(result);
      } else {
        this.logger.log(`No users to sync to ${fragmentNode.id}`);
        results.push({
          nodeId: fragmentNode.id,
          success: true,
          recordsCount: 0,
        });
      }
    }

    return results;
  }

  /**
   * Sync data to a specific fragment node in chunks
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
        const chunkNum = Math.floor(i / CHUNK_SIZE) + 1;
        const totalChunks = Math.ceil(users.length / CHUNK_SIZE);

        this.logger.log(
          `Sending chunk ${chunkNum}/${totalChunks} with ${chunk.length} users to ${node.id}`,
        );

        const response = await fetch(`${node.url}/partition/bulk-insert`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ users: chunk }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `HTTP ${response.status}: ${response.statusText} - ${errorText}`,
          );
        }

        const result = (await response.json()) as { count: number };
        totalInserted += result.count || chunk.length;

        this.logger.log(
          `Chunk ${chunkNum}/${totalChunks} synced successfully to ${node.id}`,
        );
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
    return userId % 2 === 0
      ? this.partitionService.getFragmentNodes()[0]
      : this.partitionService.getFragmentNodes()[1];
  }

  /**
   * Get partition service instance
   */
  getPartitionService(): PartitionService {
    return this.partitionService;
  }

  /**
   * Bulk insert users into database
   * Handles upsert conflicts
   */
  async bulkInsertUsers(users: User[]): Promise<number> {
    if (users.length === 0) return 0;

    try {
      this.logger.log(`Bulk inserting ${users.length} users into database`);

      // Normalize timestamps - convert ISO strings to Date objects
      const normalizedUsers = users.map((user) => ({
        ...user,
        updatedAt:
          user.updatedAt instanceof Date
            ? user.updatedAt
            : new Date(user.updatedAt as unknown as string),
      }));

      // Use upsert to handle potential conflicts
      await this.db
        .insert(schema.users)
        .values(normalizedUsers)
        .onConflictDoUpdate({
          target: schema.users.user_id,
          set: {
            username: schema.users.username,
            first_name: schema.users.first_name,
            last_name: schema.users.last_name,
            city: schema.users.city,
            country: schema.users.country,
            zipcode: schema.users.zipcode,
            gender: schema.users.gender,
            updatedAt: schema.users.updatedAt,
          },
        });

      this.logger.log(`Successfully inserted ${users.length} users`);
      return users.length;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Bulk insert failed: ${errorMsg}`,
        error instanceof Error ? error.stack : '',
      );
      throw error;
    }
  }
}
