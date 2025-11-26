/**
 * Partition Service
 * Implements consistent hashing with modulo algorithm to distribute data across nodes
 */

export interface PartitionNode {
  id: string;
  role: 'master' | 'slave';
  port: number;
  url: string;
}

export interface PartitionConfig {
  nodes: PartitionNode[];
  partitionKey: string; // The field to hash (e.g., 'userId' or 'username')
}

export class PartitionService {
  private config: PartitionConfig;

  constructor(config: PartitionConfig) {
    this.config = config;
  }

  /**
   * Calculate hash using simple modulo algorithm
   * @param key - The value to hash
   * @param nodeCount - Number of nodes to distribute across
   * @returns Partition index (0 to nodeCount-1)
   */
  private hashModulo(key: string | number, nodeCount: number): number {
    // Convert to string and get char codes sum
    const keyStr = String(key);
    let hash = 0;

    for (let i = 0; i < keyStr.length; i++) {
      hash += keyStr.charCodeAt(i);
    }

    return Math.abs(hash) % nodeCount;
  }

  /**
   * Get the partition index for a given key
   */
  getPartitionIndex(key: string | number): number {
    return this.hashModulo(key, this.config.nodes.length);
  }

  /**
   * Get the target node for a given key
   */
  getTargetNode(key: string | number): PartitionNode {
    const index = this.getPartitionIndex(key);
    return this.config.nodes[index];
  }

  /**
   * Get all slave nodes
   */
  getSlaveNodes(): PartitionNode[] {
    return this.config.nodes.filter((node) => node.role === 'slave');
  }

  /**
   * Get master node
   */
  getMasterNode(): PartitionNode | undefined {
    return this.config.nodes.find((node) => node.role === 'master');
  }

  /**
   * Partition data into buckets for each node
   */
  partitionData<T>(
    data: T[],
    keyExtractor: (item: T) => string | number,
  ): Map<string, T[]> {
    const partitions = new Map<string, T[]>();

    // Initialize partitions for each node
    this.config.nodes.forEach((node) => {
      partitions.set(node.id, []);
    });

    // Distribute data based on hash
    data.forEach((item) => {
      const key = keyExtractor(item);
      const node = this.getTargetNode(key);
      const nodeData = partitions.get(node.id) || [];
      nodeData.push(item);
      partitions.set(node.id, nodeData);
    });

    return partitions;
  }

  /**
   * Get statistics about partitioned data
   */
  getPartitionStats(
    partitions: Map<string, unknown[]>,
  ): Record<string, number> {
    const stats: Record<string, number> = {};

    partitions.forEach((data, nodeId) => {
      const node = this.config.nodes.find((n) => n.id === nodeId);
      if (node) {
        stats[`${node.role}:${node.id}`] = data.length;
      }
    });

    return stats;
  }
}
