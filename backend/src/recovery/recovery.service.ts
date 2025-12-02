// src/recovery/recovery.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import * as schema from '../../db-schema/schema';
import { ReplicationDto } from '../replication/dto/replication-payload.dto';
import { ReplicationService } from '../replication/replication.service';
import { IsolationLevel } from 'src/enums/isolation-level';
import { RepOperationType } from 'src/enums/operation-type';
import {
  RecoveryResult,
  RecoveryResultRow,
} from './interfaces/recovery-result';
import { ReplicationStatus } from 'src/enums/replication-status';

const NODE_NAME = process.env.NODE_NAME ?? 'node1';
const CENTRAL_URL = process.env.CENTRAL_URL ?? 'http://node1:3000';

type Db = NodePgDatabase<typeof schema>;

@Injectable()
export class RecoveryService {
  constructor(
    @Inject('DatabaseAsyncProvider') private readonly db: Db,
    private readonly replicationService: ReplicationService,
  ) {}

  /**
   * Scan replication_log for PENDING rows where this node is the source,
   * and retry sending them to their respective targetNode.
   *
   * You can call this:
   * - manually from a controller (/recovery/run)
   * - on startup (e.g. in onModuleInit)
   * - or from a cron job if you want
   */
  async replayPendingOutgoing(limit = 100): Promise<RecoveryResult> {
    // 1) fetch all PENDING outgoing logs for this source node
    const pending = await this.db
      .select()
      .from(schema.replicationLog)
      .where(
        and(
          eq(schema.replicationLog.sourceNode, NODE_NAME),
          eq(schema.replicationLog.status, 'PENDING'),
        ),
      )
      .limit(limit);

    const details: RecoveryResultRow[] = [];

    for (const row of pending) {
      const targetNode = row.targetNode;
      const globalTxId = row.globalTxId;

      // if you didn't store isolation in the log, just pick a default for replay
      const isolation: IsolationLevel = IsolationLevel.READ_COMMITTED;

      const dto: ReplicationDto = {
        globalTxId,
        sourceNode: row.sourceNode,
        targetNode,
        operation: row.operation as RepOperationType,
        userPk: row.userPk,
        isolation,
        payload: row.payload as ReplicationDto['payload'],
      };

      const baseUrl =
        targetNode === 'node1'
          ? CENTRAL_URL
          : (process.env[`${targetNode.toUpperCase()}_URL`] ??
            `http://${targetNode}:3000`);

      let status: ReplicationStatus = ReplicationStatus.PENDING;
      let appliedOnTarget = false;
      let reasonOnTarget: string | null = null;
      let error: string | undefined;

      try {
        const res = await fetch(`${baseUrl}/replication/apply`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dto),
        });

        if (res.ok) {
          const body = (await res.json().catch(() => ({}))) as Record<
            string,
            unknown
          >;
          appliedOnTarget = !!body.applied;
          reasonOnTarget = (body.reason as string) ?? null;
          status = ReplicationStatus.APPLIED;

          // mark as APPLIED so we don't retry infinitely
          await this.replicationService.markApplied(globalTxId);
        } else {
          status = ReplicationStatus.FAILED;
          error = `HTTP ${res.status} ${await res.text().catch(() => '')}`;
        }
      } catch (e: unknown) {
        status = ReplicationStatus.PENDING; // still pending, will be retried next time
        const errorMessage = e instanceof Error ? e.message : String(e);
        error = errorMessage;
      }

      details.push({
        globalTxId,
        targetNode,
        status,
        appliedOnTarget,
        reasonOnTarget,
        error,
      });
    }

    const succeeded = details.filter((d) => d.status === 'APPLIED').length;
    const failed = details.filter((d) => d.status === 'FAILED').length;

    return {
      sourceNode: NODE_NAME,
      totalPending: pending.length,
      attempted: details.length,
      succeeded,
      failed,
      details,
    };
  }
}
