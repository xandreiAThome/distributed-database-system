import { ReplicationTrace } from 'src/replication/interfaces/replication-trace.interface';
import { IsolationLevel } from 'src/enums/isolation-level';
import { User } from 'db-schema/user';

export interface LocalTxnTrace {
  node: string;
  role: 'CENTRAL' | 'FRAGMENT';
  isolation: IsolationLevel;
  operation: string;
  userId: number;

  // write txns
  before?: User | null;
  after?: User | null;

  // (optional) for special read scenarios like Case2
  readBefore?: User | null;
  readAfter?: User | null;

  replication?: ReplicationTrace | null;
  finalRowOnNode?: User | null;

  steps?: Array<{
    label: string;
    at: string;
    row: User | null;
  }>;
}
