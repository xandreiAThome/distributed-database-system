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
    const baseQuery = this.db.select().from(schema.dimUsers);
    const query = limit !== undefined ? baseQuery.limit(limit) : baseQuery;
    const res = await query;

    return res;
  }

  async getUserById(id: number) {
    const res = await this.db
      .select()
      .from(schema.dimUsers)
      .where(eq(schema.dimUsers.userId, id));

    if (!res.length) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return res;
  }

  async getUsersByName(name: string, limit: number = 10) {
    const search = `%${name}%`.trim();
    const res = await this.db
      .select()
      .from(schema.dimUsers)
      .where(
        ilike(
          sql`${schema.dimUsers.firstName} || ' ' || ${schema.dimUsers.lastName}`,
          search,
        ),
      )
      .limit(limit);

    return res;
  }

  async createUser(dto: CreateUserDto) {
    const existing = await this.db
      .select()
      .from(schema.dimUsers)
      .where(eq(schema.dimUsers.username, dto.username));

    if (existing.length > 0) {
      throw new BadRequestException('Username already exists');
    }
    const [res] = await this.db
      .insert(schema.dimUsers)
      .values({ ...dto })
      .returning();

    return res;
  }

  async deleteUser(id: number) {
    const res = await this.db
      .delete(schema.dimUsers)
      .where(eq(schema.dimUsers.userId, id))
      .returning();

    if (!res.length) {
      throw new NotFoundException('User not found');
    }

    return { message: `User with ID ${id} deleted successfully` };
  }

  async updateUser(id: number, dto: UpdateUserDto) {
    const res = await this.db
      .update(schema.dimUsers)
      .set({ ...dto })
      .where(eq(schema.dimUsers.userId, id))
      .returning();

    if (!res.length) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return res[0];
  }

  async bulkInsertUsers(
    users: Record<string, string | number>[],
  ): Promise<number> {
    if (users.length === 0) {
      return 0;
    }

    // Convert snake_case from network to camelCase for Drizzle ORM
    const convertedUsers = users.map((user) => ({
      userId: user.user_id as number,
      username: user.username as string,
      firstName: user.first_name as string,
      lastName: user.last_name as string,
      city: user.city as string,
      country: user.country as string,
      zipcode: user.zipcode as string,
      gender: user.gender as string,
    }));

    // Insert users and get the count of inserted rows
    const inserted = await this.db
      .insert(schema.dimUsers)
      .values(convertedUsers)
      .returning();

    return inserted.length;
  }
}
