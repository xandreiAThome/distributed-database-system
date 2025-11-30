import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { User } from 'db-schema/user';
import { DatabaseAsyncProvider } from 'src/database/database.provider';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from 'db-schema/schema';
import { eq, sql, ilike } from 'drizzle-orm';
import { CreateUserDto } from './dto/create-user.dto';
import { BadRequestException } from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @Inject(DatabaseAsyncProvider)
    private db: NodePgDatabase<typeof schema>,
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

  /*
  async createUser(dto: CreateUserDto) {
    const existing = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.username, dto.username));

    if (existing.length > 0) {
      throw new BadRequestException('Username already exists');
    }
    const [res] = await this.db
      .insert(schema.users)
      .values({ ...dto })
      .returning();

    return res;
  }

  
  async deleteUser(id: number) {
    const res = await this.db
      .delete(schema.users)
      .where(eq(schema.users.user_id, id))
      .returning();

    if (!res.length) {
      throw new NotFoundException('User not found');
    }

    return { message: `User with ID ${id} deleted successfully` };
  }

  async updateUser(id: number, dto: UpdateUserDto) {
    const res = await this.db
      .update(schema.users)
      .set({ ...dto })
      .where(eq(schema.users.user_id, id))
      .returning();

    if (!res.length) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return res[0];
  }

  async bulkInsertUsers(users: PlainUserDto[]): Promise<number> {
    if (users.length === 0) {
      return 0;
    }

    // Map incoming data to CreateUserDto with proper typing
    // Note: user_id is preserved from master node to maintain consistency
    const userDtos = users.map((user) => ({
      user_id: user.user_id,
      username: user.username,
      first_name: user.first_name,
      last_name: user.last_name,
      city: user.city,
      country: user.country,
      zipcode: user.zipcode,
      gender: user.gender,
    }));

    // Use onConflictDoNothing to skip duplicates gracefully
    // This handles re-syncs where users might already exist on slave nodes
    const inserted = await this.db
      .insert(schema.users)
      .values(userDtos as CreateUserDto[])
      .onConflictDoNothing()
      .returning();

    return inserted.length;
  }
  */
}
