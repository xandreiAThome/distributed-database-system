// src/txn/txn-script.types.ts
export type TxnStepType = 'READ' | 'INSERT' | 'UPDATE' | 'DELETE' | 'SLEEP';

export interface TxnStepData {
  username?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  city?: string | null;
  country?: string | null;
  zipcode?: string | null;
  gender?: string | null;
}

export interface TxnStep {
  type: TxnStepType;

  // For SLEEP
  delayMs?: number;

  // For INSERT / UPDATE
  data?: TxnStepData;
}
