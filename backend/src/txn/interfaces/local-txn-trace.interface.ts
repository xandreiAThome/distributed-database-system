import { ReplicationTrace } from 'src/replication/interfaces/replication-trace.interface';
import { IsolationLevel } from 'src/enums/isolation-level';

export interface LocalTxnTrace {
  node: string;
  role: 'CENTRAL' | 'FRAGMENT';
  isolation: IsolationLevel;
  operation: string;
  userId: number;

  // write txns
  before?: any;
  after?: any;

  // (optional) for special read scenarios like Case2
  readBefore?: any;
  readAfter?: any;

  replication?: ReplicationTrace | null;
  finalRowOnNode?: any;

  steps?: Array<{
    label: string;
    at: string;
    row: any | null;
  }>;
}
