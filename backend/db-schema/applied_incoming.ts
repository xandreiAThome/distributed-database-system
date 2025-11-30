import {
  pgTable,
  integer,
  text,
  timestamp,
  jsonb,
  uuid,
  serial,
  varchar,
} from 'drizzle-orm/pg-core';

export const appliedIncoming = pgTable('applied_incoming', {
  globalTxId: uuid('global_tx_id').primaryKey(),
});
