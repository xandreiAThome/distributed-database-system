// src/txn/txn.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { sql, eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { randomUUID } from 'crypto';

import * as schema from '../../db-schema/schema';
import { IsolationLevel } from 'src/enums/isolation-level';
import { ReplicationDto } from 'src/replication/dto/replication-payload.dto';
import { ReplicationService } from '../replication/replication.service';
import { ReplicationTrace } from 'src/replication/interfaces/replication-trace.interface';
import { LocalTxnTrace } from './interfaces/local-txn-trace.interface';
import { ScriptedTxnDto } from './dto/scripted-txn.dto';
import { InsertTxnDto } from './dto/insert-txn.dto';
import { RepOperationType } from 'src/enums/operation-type';
import type { User } from '../../db-schema/user';

const NODE_NAME = process.env.NODE_NAME ?? 'node1';
const CENTRAL_URL = process.env.CENTRAL_URL ?? 'http://node1:3000';
const ROLE = (process.env.NODE_ROLE as 'CENTRAL' | 'FRAGMENT') ?? 'FRAGMENT';
const EVEN_NODE = process.env.EVEN_NODE ?? 'node2';
const ODD_NODE = process.env.ODD_NODE ?? 'node3';

type Db = NodePgDatabase<typeof schema>;

type ReplicationStatus = 'APPLIED' | 'PENDING' | 'FAILED';

@Injectable()
export class TxnService {
  constructor(
    @Inject('DatabaseAsyncProvider') private readonly db: Db,
    private readonly replicationService: ReplicationService,
  ) {}

  // IF WE TREAT CENTRAL AS THE ONLY NODE THAT CAN GENERATE PKs
  async allocateUserId(): Promise<{ userId: number }> {
    if (ROLE !== 'CENTRAL') {
      throw new Error('ID allocation is only allowed on the central node');
    }

    const rows = await this.db
      .select({
        max: sql<number>`COALESCE(MAX(${schema.users.user_id}), 0)`,
      })
      .from(schema.users);

    const max = rows[0]?.max ?? 0;
    const userId = max + 1;

    return { userId };
  }

  // IF EACH NODE CAN GENERATE THEIR OWN PKs
  private async generateNewUserId(): Promise<number> {
    const rows = await this.db
      .select({
        maxId: sql<number>`COALESCE(MAX(${schema.users.user_id}), 0)`,
      })
      .from(schema.users);

    const maxId = rows[0]?.maxId ?? 0;
    const newId = maxId + 1;

    // Central: simple max + 1
    if (ROLE === 'CENTRAL') {
      return newId;
    }

    // Fragment nodes: parity-based sequences
    if (NODE_NAME === EVEN_NODE) {
      return newId % 2 === 0 ? newId : newId + 1;
    }

    if (NODE_NAME === ODD_NODE) {
      return newId % 2 === 1 ? newId : newId + 1;
    }

    return newId;
  }

  private chooseTargetNode(userId: number): string | null {
    // Fragment nodes always replicate "up" to central
    if (ROLE === 'FRAGMENT') {
      return 'node1';
    }

    // Central decides fragment based on modulo rule
    if (ROLE === 'CENTRAL') {
      return userId % 2 === 0 ? EVEN_NODE : ODD_NODE;
    }

    return null;
  }

  private async runWithIsolation<T>(
    isolation: IsolationLevel,
    fn: (tx: Db) => Promise<T>,
  ): Promise<T> {
    return this.db.transaction(async (tx) => {
      await tx.execute(
        sql.raw(`SET TRANSACTION ISOLATION LEVEL ${isolation};`),
      );
      return fn(tx);
    });
  }

  // Perform a scripted txn ON THE SAME PRIMARY KEY
  async runScriptedTxn(body: ScriptedTxnDto): Promise<LocalTxnTrace> {
    const { isolation, userId, simReplicationError, steps } = body;
    const now = new Date();
    const targetNode = this.chooseTargetNode(userId);

    const traceSteps: NonNullable<LocalTxnTrace['steps']> = [];
    let lastRow: User | null = null;
    let beforeRow: User | null = null;

    // Run the whole script in ONE DB transaction
    const { finalRow, replicationDto } = await this.runWithIsolation<{
      finalRow: User | null;
      replicationDto: ReplicationDto | null;
    }>(isolation, async (tx) => {
      // Capture the "before" state at the start of the transaction
      const beforeRows = await tx
        .select()
        .from(schema.users)
        .where(eq(schema.users.user_id, userId));
      beforeRow = beforeRows[0] ?? null;
      lastRow = beforeRow;

      // ----- interpret steps -----
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];

        if (step.type === 'SLEEP') {
          await new Promise((res) => setTimeout(res, step.delayMs ?? 0));
          traceSteps.push({
            label: `SLEEP_${i}`,
            at: new Date().toISOString(),
            row: lastRow,
          });
          continue;
        }

        if (step.type === 'READ') {
          const rows = await tx
            .select()
            .from(schema.users)
            .where(eq(schema.users.user_id, userId));
          lastRow = rows[0] ?? null;

          if (!beforeRow) beforeRow = lastRow;

          traceSteps.push({
            label: `READ_${i}`,
            at: new Date().toISOString(),
            row: lastRow,
          });
          continue;
        }

        if (step.type === 'INSERT') {
          const data = step.data ?? {};
          const baseNow = new Date();

          // basic upsert-style insert/update
          const existing = await tx
            .select()
            .from(schema.users)
            .where(eq(schema.users.user_id, userId));

          if (existing.length === 0) {
            await tx.insert(schema.users).values({
              user_id: userId,
              username: data.username ?? null,
              first_name: data.first_name ?? null,
              last_name: data.last_name ?? null,
              city: data.city ?? null,
              country: data.country ?? null,
              zipcode: data.zipcode ?? null,
              gender: data.gender ?? null,
              updatedAt: baseNow,
            });
          } else {
            const base = existing[0];
            await tx
              .update(schema.users)
              .set({
                username: data.username ?? base.username ?? null,
                first_name: data.first_name ?? base.first_name ?? null,
                last_name: data.last_name ?? base.last_name ?? null,
                city: data.city ?? base.city ?? null,
                country: data.country ?? base.country ?? null,
                zipcode: data.zipcode ?? base.zipcode ?? null,
                gender: data.gender ?? base.gender ?? null,
                updatedAt: baseNow,
              })
              .where(eq(schema.users.user_id, userId));
          }

          const rows = await tx
            .select()
            .from(schema.users)
            .where(eq(schema.users.user_id, userId));
          lastRow = rows[0] ?? null;

          traceSteps.push({
            label: `INSERT_${i}`,
            at: new Date().toISOString(),
            row: lastRow,
          });
          continue;
        }

        if (step.type === 'UPDATE') {
          const data = (step.data ?? {}) as Partial<Omit<User, 'user_id'>>;
          const base = (lastRow ?? beforeRow ?? {}) as Partial<User>;
          const baseNow = new Date();

          await tx
            .update(schema.users)
            .set({
              username: data.username ?? base.username ?? null,
              first_name: data.first_name ?? base.first_name ?? null,
              last_name: data.last_name ?? base.last_name ?? null,
              city: data.city ?? base.city ?? null,
              country: data.country ?? base.country ?? null,
              zipcode: data.zipcode ?? base.zipcode ?? null,
              gender: data.gender ?? base.gender ?? null,
              updatedAt: baseNow,
            })
            .where(eq(schema.users.user_id, userId));

          const rows = await tx
            .select()
            .from(schema.users)
            .where(eq(schema.users.user_id, userId));
          lastRow = rows[0] ?? null;

          traceSteps.push({
            label: `UPDATE_${i}`,
            at: new Date().toISOString(),
            row: lastRow,
          });
          continue;
        }

        if (step.type === 'DELETE') {
          await tx.delete(schema.users).where(eq(schema.users.user_id, userId));
          lastRow = null;

          traceSteps.push({
            label: `DELETE_${i}`,
            at: new Date().toISOString(),
            row: null,
          });
          continue;
        }
      }

      const localFinalRow: User | null = lastRow;
      let localReplicationDto: ReplicationDto | null = null;

      // Only replicate if we have a target node AND at least one mutating op
      const hasMutation = steps.some(
        (s) =>
          s.type === 'INSERT' || s.type === 'UPDATE' || s.type === 'DELETE',
      );

      if (targetNode && hasMutation) {
        const globalTxId = randomUUID();
        const isDelete = localFinalRow == null;

        const payload: ReplicationDto['payload'] = isDelete
          ? {
              updatedAt: now.toISOString(),
            }
          : {
              username: localFinalRow?.username ?? undefined,
              first_name: localFinalRow?.first_name ?? undefined,
              last_name: localFinalRow?.last_name ?? undefined,
              city: localFinalRow?.city ?? undefined,
              country: localFinalRow?.country ?? undefined,
              zipcode: localFinalRow?.zipcode ?? undefined,
              gender: localFinalRow?.gender ?? undefined,
              updatedAt: (localFinalRow?.updatedAt ?? now).toISOString(),
            };

        localReplicationDto = {
          globalTxId,
          sourceNode: NODE_NAME,
          targetNode,
          operation: isDelete
            ? RepOperationType.DELETE
            : RepOperationType.UPSERT,
          userPk: userId,
          isolation,
          payload,
        };

        await tx.insert(schema.replicationLog).values({
          globalTxId,
          sourceNode: localReplicationDto.sourceNode,
          targetNode: localReplicationDto.targetNode,
          operation: localReplicationDto.operation,
          userPk: localReplicationDto.userPk,
          payload: localReplicationDto.payload as any,
          status: 'PENDING',
          createdAt: now,
        });
      }

      return {
        finalRow: localFinalRow,
        replicationDto: localReplicationDto,
      };
    });

    // ---------- AFTER COMMIT: send replication + build replication trace ----------

    const trace: LocalTxnTrace = {
      node: NODE_NAME,
      role: ROLE,
      isolation,
      operation: 'SCRIPTED',
      userId,
      before: beforeRow ?? undefined,
      after: finalRow ?? undefined,
      steps: traceSteps,
      replicationDto,
    };

    return trace;
  }

  // Perform an insert txn with auto generated pk
  async performInsertTxn(body: InsertTxnDto): Promise<LocalTxnTrace> {
    const now = new Date();
    const { isolation, simReplicationError, ...fields } = body;

    // 1) Get a new userId
    const userId = await this.generateNewUserId();

    // 2) Decide where this row should replicate to
    const targetNode = this.chooseTargetNode(userId);

    const beforeRow: User | null = null; // new row, so "before" is always null/undefined

    // 3) LOCAL TXN: insert into users + replication_log in the same transaction
    const { finalRow, replicationDto } = await this.runWithIsolation<{
      finalRow: User | null;
      replicationDto: ReplicationDto | null;
    }>(isolation, async (tx) => {
      let localFinalRow: User | null = null;
      let localReplicationDto: ReplicationDto | null = null;

      // upsert on THIS node (insert or update if PK already exists)
      await tx
        .insert(schema.users)
        .values({
          user_id: userId,
          username: fields.username ?? null,
          first_name: fields.first_name ?? null,
          last_name: fields.last_name ?? null,
          city: fields.city ?? null,
          country: fields.country ?? null,
          zipcode: fields.zipcode ?? null,
          gender: fields.gender ?? null,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: schema.users.user_id,
          set: {
            // if the incoming field is provided, use it; otherwise keep existing value
            username: fields.username ?? sql`EXCLUDED.username`,
            first_name: fields.first_name ?? sql`EXCLUDED.first_name`,
            last_name: fields.last_name ?? sql`EXCLUDED.last_name`,
            city: fields.city ?? sql`EXCLUDED.city`,
            country: fields.country ?? sql`EXCLUDED.country`,
            zipcode: fields.zipcode ?? sql`EXCLUDED.zipcode`,
            gender: fields.gender ?? sql`EXCLUDED.gender`,
            updatedAt: now,
          },
        }); // cast if TS complains about drizzle's type

      const rows = await tx
        .select()
        .from(schema.users)
        .where(eq(schema.users.user_id, userId));
      localFinalRow = rows[0] ?? null;

      // build replication dto + write replication_log if we have a target
      if (targetNode) {
        const globalTxId = randomUUID();

        const payload: ReplicationDto['payload'] = {
          username: localFinalRow?.username ?? undefined,
          first_name: localFinalRow?.first_name ?? undefined,
          last_name: localFinalRow?.last_name ?? undefined,
          city: localFinalRow?.city ?? undefined,
          country: localFinalRow?.country ?? undefined,
          zipcode: localFinalRow?.zipcode ?? undefined,
          gender: localFinalRow?.gender ?? undefined,
          updatedAt: (localFinalRow?.updatedAt ?? now).toISOString(),
        };

        localReplicationDto = {
          globalTxId,
          sourceNode: NODE_NAME,
          targetNode,
          operation: RepOperationType.UPSERT, // new row, let applyIncoming handle upsert/timestamp conflict
          userPk: userId,
          isolation,
          payload,
        };

        await tx.insert(schema.replicationLog).values({
          globalTxId,
          sourceNode: localReplicationDto.sourceNode,
          targetNode: localReplicationDto.targetNode,
          operation: localReplicationDto.operation,
          userPk: localReplicationDto.userPk,
          payload: localReplicationDto.payload as any,
          status: 'PENDING',
          createdAt: now,
        });
      }

      return {
        finalRow: localFinalRow,
        replicationDto: localReplicationDto,
      };
    });

    const trace: LocalTxnTrace = {
      node: NODE_NAME,
      role: ROLE,
      isolation,
      operation: 'INSERT',
      userId,
      before: beforeRow ?? undefined,
      after: finalRow ?? undefined,
      replicationDto,
    };

    return trace;
  }

  /*
  // Perform an insert txn with auto generated pk using central as the generator
  async performInsertTxn(body: InsertTxnDto): Promise<LocalTxnTrace> {
    const now = new Date();
    const { isolation, simReplicationError, ...fields } = body;

    // 1) Get a new userId
    let userId: number;

    if (ROLE === 'CENTRAL') {
      // generate locally
      const res = await this.allocateUserId();
      userId = res.userId;
    } else {
      // fragment → ask central
      const res = await fetch(`${CENTRAL_URL}/txn/id/allocate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        throw new Error(
          `Failed to allocate userId from central: ${res.status}`,
        );
      }
      const json = await res.json();
      userId = json.userId;

      if (NODE_NAME === 'node2' && userId % 2 === 1) {
        userId += 1; // bump to next even number
      }

      if (NODE_NAME === 'node3' && userId % 2 === 0) {
        userId += 1; // bump to next odd number
      }
    }

    // 2) Decide where this row should replicate to
    const targetNode = this.chooseTargetNode(userId);

    let beforeRow: any = null; // new row, so "before" is always null/undefined

    // 3) LOCAL TXN: insert into users + replication_log in the same transaction
    const { finalRow, replicationDto } = await this.runWithIsolation<{
      finalRow: any;
      replicationDto: ReplicationDto | null;
    }>(isolation, async (tx) => {
      let localFinalRow: any = null;
      let localReplicationDto: ReplicationDto | null = null;

      // upsert on THIS node (insert or update if PK already exists)
      await tx
        .insert(schema.users)
        .values({
          user_id: userId,
          username: fields.username ?? null,
          first_name: fields.first_name ?? null,
          last_name: fields.last_name ?? null,
          city: fields.city ?? null,
          country: fields.country ?? null,
          zipcode: fields.zipcode ?? null,
          gender: fields.gender ?? null,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: schema.users.user_id,
          set: {
            // if the incoming field is provided, use it; otherwise keep existing value
            username: fields.username ?? sql`EXCLUDED.username`,
            first_name: fields.first_name ?? sql`EXCLUDED.first_name`,
            last_name: fields.last_name ?? sql`EXCLUDED.last_name`,
            city: fields.city ?? sql`EXCLUDED.city`,
            country: fields.country ?? sql`EXCLUDED.country`,
            zipcode: fields.zipcode ?? sql`EXCLUDED.zipcode`,
            gender: fields.gender ?? sql`EXCLUDED.gender`,
            updatedAt: now,
          },
        }); // cast if TS complains about drizzle's type

      const rows = await tx
        .select()
        .from(schema.users)
        .where(eq(schema.users.user_id, userId));
      localFinalRow = rows[0] ?? null;

      // build replication dto + write replication_log if we have a target
      if (targetNode) {
        const globalTxId = randomUUID();

        const payload: ReplicationDto['payload'] = {
          username: localFinalRow?.username ?? null,
          first_name: localFinalRow?.first_name ?? null,
          last_name: localFinalRow?.last_name ?? null,
          city: localFinalRow?.city ?? null,
          country: localFinalRow?.country ?? null,
          zipcode: localFinalRow?.zipcode ?? null,
          gender: localFinalRow?.gender ?? null,
          updatedAt: (localFinalRow?.updatedAt ?? now).toISOString(),
        };

        localReplicationDto = {
          globalTxId,
          sourceNode: NODE_NAME,
          targetNode,
          operation: 'UPSERT', // new row, let applyIncoming handle upsert/timestamp conflict
          userPk: userId,
          isolation,
          payload,
        };

        await tx.insert(schema.replicationLog).values({
          globalTxId,
          sourceNode: localReplicationDto.sourceNode,
          targetNode: localReplicationDto.targetNode,
          operation: localReplicationDto.operation,
          userPk: localReplicationDto.userPk,
          payload: localReplicationDto.payload as any,
          status: 'PENDING',
          createdAt: now,
        });
      }

      return {
        finalRow: localFinalRow,
        replicationDto: localReplicationDto,
      };
    });

    // 4) AFTER COMMIT: send replication + mark APPLIED + build replicationTrace
    let replicationTrace: ReplicationTrace | null = null;

    if (replicationDto) {
      const baseUrl =
        replicationDto.targetNode === 'node1'
          ? CENTRAL_URL
          : `http://${replicationDto.targetNode}:3000`;

      let status: ReplicationStatus = 'PENDING';
      let appliedOnTarget = false;
      let reasonOnTarget: string | null = null;

      if (!simReplicationError) {
        try {
          const res = await fetch(`${baseUrl}/replication/apply`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(replicationDto),
          });

          if (res.ok) {
            const body = (await res.json().catch(() => ({}))) as Record<
              string,
              unknown
            >;
            appliedOnTarget = !!body.applied;
            reasonOnTarget = (body.reason as string) ?? null;
            status = 'APPLIED';

            await this.replicationService.markApplied(
              replicationDto.globalTxId,
            );
          } else {
            console.error(
              'Replication apply returned non-OK',
              res.status,
              await res.text().catch(() => ''),
            );
            status = 'FAILED';
          }
        } catch (err) {
          console.error('Replication HTTP failed', err);
          status = 'PENDING'; // stays pending for recovery
        }
      }

      replicationTrace = {
        targetNode: replicationDto.targetNode,
        globalTxId: replicationDto.globalTxId,
        status,
        appliedOnTarget,
        reasonOnTarget,
      };
    }

    // 5) read back final row on THIS node
    const finalRows = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.user_id, userId));

    const trace: LocalTxnTrace = {
      node: NODE_NAME,
      role: ROLE,
      isolation,
      operation: 'INSERT',
      userId,
      before: beforeRow ?? undefined,
      after: finalRow ?? undefined,
      replication: replicationTrace,
      finalRowOnNode: finalRows[0] ?? undefined,
    };

    return trace;
  }
    */
}
