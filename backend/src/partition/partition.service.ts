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
   * Only partitions across slave nodes (master keeps everything)
   * @param key - The value to hash (userId)
   * @param slaveNodeCount - Number of slave nodes to distribute across
   * @returns Partition index (0 to slaveNodeCount-1)
   */
  private hashModulo(key: string | number, slaveNodeCount: number): number {
    // Direct modulo on the numeric value for consistent distribution
    // Only distributes across slave nodes, not master
    const numericKey = typeof key === 'string' ? parseInt(key, 10) : key;
    return Math.abs(numericKey) % slaveNodeCount;
  }

  /**
   * Get the partition index for a given key (only across slaves)
   */
  getPartitionIndex(key: string | number): number {
    const slaveNodes = this.getSlaveNodes();
    return this.hashModulo(key, slaveNodes.length);
  }

  /**
   * Get the target node for a given key (only returns slave nodes)
   */
  getTargetNode(key: string | number): PartitionNode {
    const slaveNodes = this.getSlaveNodes();
    const index = this.getPartitionIndex(key);
    return slaveNodes[index];
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
  getPartitionStats<T>(partitions: Map<string, T[]>): Record<string, number> {
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
