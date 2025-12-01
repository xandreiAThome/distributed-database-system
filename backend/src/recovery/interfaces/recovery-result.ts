import { ReplicationStatus } from 'src/replication/interfaces/replication-trace.interface';

export interface RecoveryResultRow {
  globalTxId: string;
  targetNode: string;
  status: ReplicationStatus;
  appliedOnTarget: boolean;
  reasonOnTarget: string | null;
  error?: string;
}

export interface RecoveryResult {
  sourceNode: string;
  totalPending: number;
  attempted: number;
  succeeded: number;
  failed: number;
  details: RecoveryResultRow[];
}
