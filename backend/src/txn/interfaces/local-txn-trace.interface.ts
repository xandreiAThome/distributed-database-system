import { IsolationLevel } from 'src/enums/isolation-level';
import { ReplicationDto } from 'src/replication/dto/replication-payload.dto';

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

  replicationDto?: ReplicationDto | null;
  finalRowOnNode?: any;

  steps?: Array<{
    label: string;
    at: string;
    row: any | null;
  }>;
}
