import { pgTable, uuid } from 'drizzle-orm/pg-core';

export const appliedIncoming = pgTable('applied_incoming', {
  globalTxId: uuid('global_tx_id').primaryKey(),
});
