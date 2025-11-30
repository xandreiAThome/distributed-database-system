import { IsolationLevel } from 'src/enums/isolation-level';

export interface ReplicationPayload {
  globalTxId: string;
  sourceNode: string;
  targetNode: string;
  operation: 'UPSERT' | 'DELETE';
  userPk: number;
  isolation: IsolationLevel;
  payload: {
    username?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    city?: string | null;
    country?: string | null;
    zipcode?: string | null;
    gender?: string | null;
    updatedAt: string; // ISO string
  };
}
