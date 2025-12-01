export type ReplicationStatus = 'APPLIED' | 'PENDING' | 'FAILED';

export interface ReplicationTrace {
  targetNode: string;
  globalTxId: string;
  status: ReplicationStatus;
  appliedOnTarget?: boolean;
  reasonOnTarget?: string | null;
}
