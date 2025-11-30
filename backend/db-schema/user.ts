import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { pgTable, integer, timestamp, varchar } from 'drizzle-orm/pg-core';

export const users = pgTable('dim_users', {
  user_id: integer('users_id').primaryKey(),
  username: varchar('username', { length: 40 }),
  first_name: varchar('first_name', { length: 40 }),
  last_name: varchar('last_name', { length: 50 }),
  city: varchar('city', { length: 50 }),
  country: varchar('country', { length: 100 }),
  zipcode: varchar('zipcode', { length: 20 }),
  gender: varchar('gender', { length: 6 }),
  updatedAt: timestamp('updatedat'),
});

export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;
