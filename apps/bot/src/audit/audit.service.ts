import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

export interface AuditLogParams {
  actorId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  payload?: Record<string, unknown>;
  ipAddress?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  // Audit log writes must never propagate errors — a failed audit log is not
  // a reason to roll back the operation that triggered it.
  async log(params: AuditLogParams): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          actorId: params.actorId ?? null,
          action: params.action,
          entityType: params.entityType,
          entityId: params.entityId ?? null,
          payload: params.payload ?? null,
          ipAddress: params.ipAddress ?? null,
        },
      });
    } catch (err) {
      this.logger.error(
        `Failed to write audit log [action=${params.action}, entity=${params.entityType}:${params.entityId}]`,
        err instanceof Error ? err.stack : String(err),
      );
    }
  }
}
