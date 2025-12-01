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

export const replicationLog = pgTable('replication_log', {
  id: serial('id').primaryKey(),
  globalTxId: uuid('global_tx_id').notNull(),
  sourceNode: text('source_node').notNull(),
  targetNode: text('target_node').notNull(),
  operation: text('operation').notNull(), // 'UPDATE' | 'INSERT' | 'DELETE'
  userPk: integer('user_pk').notNull(),
  payload: jsonb('payload').notNull(), // includes updated_at
  status: text('status').notNull(), // 'PENDING' | 'APPLIED' | 'FAILED'
  createdAt: timestamp('created_at').notNull(),
});
