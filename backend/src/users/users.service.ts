import { Inject, Injectable } from '@nestjs/common';
import { User } from 'db-schema/user';
import { DatabaseAsyncProvider } from 'src/database/database.provider';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from 'db-schema/schema';

@Injectable()
export class UsersService {
  constructor(
    @Inject(DatabaseAsyncProvider)
    private db: NodePgDatabase<typeof schema>,
  ) {}
  async getAllUsers(limit?: number): Promise<User[]> {
    const baseQuery = this.db.select().from(schema.dimUsers);
    const query = limit !== undefined ? baseQuery.limit(limit) : baseQuery;
    const res = await query;

    return res;
  }
}
