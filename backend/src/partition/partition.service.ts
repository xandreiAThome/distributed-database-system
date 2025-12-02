import { Injectable, Logger } from '@nestjs/common';
import { User } from 'db-schema/user';

export interface PartitionNode {
  id: string;
  role: 'CENTRAL' | 'FRAGMENT';
  url: string;
}

export interface PartitionStats {
  [nodeId: string]: number;
}

/**
 * Partitioning service for distributing rows from central node to fragment nodes
 * based on user_id parity:
 * - Even user_ids go to EVEN_NODE (node2)
 * - Odd user_ids go to ODD_NODE (node3)
 */
@Injectable()
export class PartitionService {
  private readonly logger = new Logger(PartitionService.name);
  private nodes: PartitionNode[];
  private centralNode: PartitionNode;
  private evenNode: PartitionNode;
  private oddNode: PartitionNode;

  constructor() {
    this.initializeNodes();
  }

  /**
   * Initialize nodes from environment variables
   */
  private initializeNodes(): void {
    const nodeName = process.env.NODE_NAME ?? 'node1';
    const centralUrl = process.env.CENTRAL_URL ?? 'http://node1:3000';
    const evenNodeName = process.env.EVEN_NODE ?? 'node2';
    const oddNodeName = process.env.ODD_NODE ?? 'node3';
    const node2Url = process.env.NODE2_URL ?? `http://${evenNodeName}:3000`;
    const node3Url = process.env.NODE3_URL ?? `http://${oddNodeName}:3000`;

    this.centralNode = {
      id: nodeName,
      role: 'CENTRAL',
      url: centralUrl,
    };

    this.evenNode = {
      id: evenNodeName,
      role: 'FRAGMENT',
      url: node2Url,
    };

    this.oddNode = {
      id: oddNodeName,
      role: 'FRAGMENT',
      url: node3Url,
    };

    this.nodes = [this.centralNode, this.evenNode, this.oddNode];
    this.logger.log(
      `Partition service initialized with nodes: ${JSON.stringify(this.nodes)}`,
    );
  }

  /**
   * Get the target node for a given user_id
   * - Even user_ids → EVEN_NODE (node2)
   * - Odd user_ids → ODD_NODE (node3)
   */
  private getTargetNodeForUserId(userId: number): PartitionNode {
    return userId % 2 === 0 ? this.evenNode : this.oddNode;
  }

  /**
   * Partition users by their target node based on user_id parity
   * Returns a Map of nodeId → users array
   */
  partitionUsers(users: User[]): Map<string, User[]> {
    const partitions = new Map<string, User[]>();

    // Initialize partition buckets
    partitions.set(this.evenNode.id, []);
    partitions.set(this.oddNode.id, []);

    // Distribute users to partition buckets
    for (const user of users) {
      const targetNode = this.getTargetNodeForUserId(user.user_id);
      const bucket = partitions.get(targetNode.id) || [];
      bucket.push(user);
      partitions.set(targetNode.id, bucket);
    }

    return partitions;
  }

  /**
   * Get partition statistics
   */
  getPartitionStats(partitions: Map<string, User[]>): PartitionStats {
    const stats: PartitionStats = {};
    for (const [nodeId, users] of partitions) {
      stats[nodeId] = users.length;
    }
    return stats;
  }

  /**
   * Get all fragment nodes
   */
  getFragmentNodes(): PartitionNode[] {
    return [this.evenNode, this.oddNode];
  }

  /**
   * Get central node
   */
  getCentralNode(): PartitionNode {
    return this.centralNode;
  }

  /**
   * Get all nodes
   */
  getAllNodes(): PartitionNode[] {
    return this.nodes;
  }
}
