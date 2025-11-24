import { pgTable, serial, varchar } from 'drizzle-orm/pg-core';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';

export const dimUsers = pgTable('dim_users', {
  userId: serial('user_id').primaryKey().notNull(),
  username: varchar({ length: 50 }).notNull(),
  firstName: varchar('first_name', { length: 40 }).notNull(),
  lastName: varchar('last_name', { length: 40 }).notNull(),
  city: varchar({ length: 50 }).notNull(),
  country: varchar({ length: 100 }).notNull(),
  zipcode: varchar({ length: 20 }).notNull(),
  gender: varchar({ length: 6 }).notNull(),
});

export type User = InferSelectModel<typeof dimUsers>;
export type NewUser = InferInsertModel<typeof dimUsers>;
