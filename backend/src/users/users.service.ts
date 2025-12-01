import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { User } from 'db-schema/user';
import { DatabaseAsyncProvider } from 'src/database/database.provider';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from 'db-schema/schema';
import { eq, sql, ilike } from 'drizzle-orm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { TxnService } from 'src/txn/txn.service';
import { IsolationLevel } from 'src/enums/isolation-level';

@Injectable()
export class UsersService {
  constructor(
    @Inject(DatabaseAsyncProvider)
    private db: NodePgDatabase<typeof schema>,
    private txnService: TxnService,
  ) {}
  async getAllUsers(limit?: number): Promise<User[]> {
    const baseQuery = this.db.select().from(schema.users);
    const query = limit !== undefined ? baseQuery.limit(limit) : baseQuery;
    const res = await query;

    return res;
  }

  async getUserById(id: number) {
    const res = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.user_id, id));

    if (!res.length) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return res;
  }

  async getUsersByName(name: string, limit: number = 10) {
    const search = `%${name}%`.trim();
    const res = await this.db
      .select()
      .from(schema.users)
      .where(
        ilike(
          sql`${schema.users.first_name} || ' ' || ${schema.users.last_name}`,
          search,
        ),
      )
      .limit(limit);

    return res;
  }

  async createUser(dto: CreateUserDto) {
    // Use performInsertTxn which handles:
    // 1. Auto-generating user_id based on node role (central vs fragments)
    // 2. Inserting locally
    // 3. Creating replication log and sending to target node
    // 4. Building replication trace
    const trace = await this.txnService.performInsertTxn({
      isolation: 'SERIALIZABLE' as IsolationLevel,
      simReplicationError: false,
      username: dto.username,
      first_name: dto.first_name,
      last_name: dto.last_name,
      city: dto.city,
      country: dto.country,
      zipcode: dto.zipcode,
      gender: dto.gender,
    });

    return {
      user: trace.after as User,
      replication: trace.replication,
      message: 'User created successfully with distributed replication',
    };
  }

  async deleteUser(id: number) {
    // Use runScriptedTxn with DELETE operation for distributed deletion
    // This handles replication to the target node based on user_id parity
    const trace = await this.txnService.runScriptedTxn({
      isolation: 'SERIALIZABLE' as IsolationLevel,
      userId: id,
      simReplicationError: false,
      steps: [
        {
          type: 'DELETE',
        },
      ],
    });

    if (!trace.before) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return {
      message: `User with ID ${id} deleted successfully with distributed replication`,
      replication: trace.replication,
      deletedUser: trace.before,
    };
  }

  async updateUser(id: number, dto: UpdateUserDto) {
    // Use runScriptedTxn with UPDATE operation for distributed updates
    // This handles replication to the target node based on user_id parity
    const trace = await this.txnService.runScriptedTxn({
      isolation: 'SERIALIZABLE' as IsolationLevel,
      userId: id,
      simReplicationError: false,
      steps: [
        {
          type: 'UPDATE',
          data: dto,
        },
      ],
    });

    if (!trace.after) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return {
      user: trace.after,
      replication: trace.replication,
      message: 'User updated successfully with distributed replication',
    };
  }
}
