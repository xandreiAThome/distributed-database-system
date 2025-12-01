// src/replication/replication.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { sql, eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db-schema/schema';
import { ReplicationDto } from './dto/replication-payload.dto';
import { RepOperationType } from '../enums/operation-type';

type Db = NodePgDatabase<typeof schema>;

const NODE_NAME = process.env.NODE_NAME ?? 'UNKNOWN';
const NODE_ROLE =
  (process.env.NODE_ROLE as 'CENTRAL' | 'FRAGMENT') ?? 'FRAGMENT';

@Injectable()
export class ReplicationService {
  constructor(@Inject('DatabaseAsyncProvider') private readonly db: Db) {}

  private shouldApplyIncoming(
    currentUpdatedAt: Date | null,
    incomingUpdatedAt: Date,
    sourceNode: string,
  ): boolean {
    const thisNodeName = NODE_NAME;
    const thisNodeRole = NODE_ROLE;

    // If no current value, always apply
    if (!currentUpdatedAt) return true;

    // Incoming is strictly newer → always apply
    if (incomingUpdatedAt > currentUpdatedAt) return true;

    // Incoming is strictly older → never apply
    if (incomingUpdatedAt < currentUpdatedAt) return false;

    // === timestamps equal ===
    // Tie-break: central beats fragments.
    // You hard-coded central as 'node1' so I'll keep that.
    // - If this node is CENTRAL and incoming is from fragment → keep local, skip
    if (thisNodeRole === 'CENTRAL' && sourceNode !== 'node1') {
      return false;
    }

    // - If this node is FRAGMENT and incoming is from CENTRAL → accept
    if (thisNodeRole === 'FRAGMENT' && sourceNode === 'node1') {
      return true;
    }

    // If both are fragments or both central, pick a stable rule.
    // For simplicity: prefer lexicographically larger node name.
    return sourceNode > thisNodeName;
  }

  /**
   * Insert into replication_log as PENDING and return globalTxId.
   */
  async logOutgoingReplication(data: ReplicationDto) {
    const globalTxId = data.globalTxId ?? randomUUID();

    await this.db.insert(schema.replicationLog).values({
      globalTxId,
      sourceNode: data.sourceNode,
      targetNode: data.targetNode,
      operation: data.operation,
      userPk: data.userPk,
      payload: data.payload as any,
      status: 'PENDING',
      createdAt: new Date(),
    });

    return { globalTxId };
  }

  /**
   * Mark replication_log entry as APPLIED.
   */
  async markApplied(globalTxId: string) {
    await this.db
      .update(schema.replicationLog)
      .set({ status: 'APPLIED' })
      .where(eq(schema.replicationLog.globalTxId, globalTxId));
  }

  /**
   * Apply incoming replication on THIS node.
   * Uses:
   *  - appliedIncoming for idempotency
   *  - updatedAt timestamp rule + central-priority tie-break to avoid stale overwrites
   */
  async applyIncomingReplication(data: ReplicationDto) {
    const { globalTxId, operation, userPk, isolation, payload, sourceNode } =
      data;
    const incomingUpdatedAt = new Date(payload.updatedAt);

    //  skip if already applied
    const already = await this.db
      .select()
      .from(schema.appliedIncoming)
      .where(eq(schema.appliedIncoming.globalTxId, globalTxId));

    if (already.length > 0) {
      return { applied: false, skipped: true, reason: 'already_applied' };
    }

    let appliedFlag = false;
    let reason = 'applied_initial';

    await this.db.transaction(async (tx) => {
      // still need raw SQL here
      await tx.execute(
        sql.raw(`SET TRANSACTION ISOLATION LEVEL ${isolation};`),
      );

      // --- get current row for timestamp comparison ---
      const currentRow = await tx.query.users.findFirst({
        where: eq(schema.users.user_id, userPk),
      });

      const currentUpdatedAt: Date | null = currentRow
        ? (currentRow.updatedAt as Date)
        : null;

      const shouldApply = this.shouldApplyIncoming(
        currentUpdatedAt,
        incomingUpdatedAt,
        sourceNode,
      );

      if (!shouldApply) {
        appliedFlag = false;
        reason =
          currentUpdatedAt && incomingUpdatedAt < currentUpdatedAt
            ? 'older_timestamp'
            : 'tie_kept_local_or_central';

        await tx.insert(schema.appliedIncoming).values({
          globalTxId,
        });
        return;
      }

      // --- apply INSERT / UPDATE / DELETE via Drizzle ---

      if (operation === RepOperationType.UPSERT) {
        if (!currentRow) {
          // No existing row → simple insert
          await tx.insert(schema.users).values({
            user_id: userPk,
            username: payload.username ?? null,
            first_name: payload.first_name ?? null,
            last_name: payload.last_name ?? null,
            city: payload.city ?? null,
            country: payload.country ?? null,
            zipcode: payload.zipcode ?? null,
            gender: payload.gender ?? null,
            updatedAt: incomingUpdatedAt,
          });
        } else {
          // Upsert if row exists
          await tx
            .update(schema.users)
            .set({
              username:
                payload.username !== undefined
                  ? payload.username
                  : currentRow.username,
              first_name:
                payload.first_name !== undefined
                  ? payload.first_name
                  : currentRow.first_name,
              last_name:
                payload.last_name !== undefined
                  ? payload.last_name
                  : currentRow.last_name,
              city: payload.city !== undefined ? payload.city : currentRow.city,
              country:
                payload.country !== undefined
                  ? payload.country
                  : currentRow.country,
              zipcode:
                payload.zipcode !== undefined
                  ? payload.zipcode
                  : currentRow.zipcode,
              gender:
                payload.gender !== undefined
                  ? payload.gender
                  : currentRow.gender,
              updatedAt: incomingUpdatedAt,
            })
            .where(eq(schema.users.user_id, userPk));
        }
      } else if (operation === RepOperationType.DELETE) {
        await tx.delete(schema.users).where(eq(schema.users.user_id, userPk));
      }

      await tx.insert(schema.appliedIncoming).values({
        globalTxId,
      });

      appliedFlag = true;
      reason = 'newer_or_tie_accept';
    });

    return {
      applied: appliedFlag,
      skipped: !appliedFlag,
      reason,
    };
  }
}
