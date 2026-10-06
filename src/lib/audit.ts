import type { Prisma } from "../../generated/prisma/client";
export async function audit(tx: Prisma.TransactionClient, input: { userId: string; action: string; entityType: string; entityId: string; oldData?: unknown; newData?: unknown }) {
  await tx.auditLog.create({ data: { userId: input.userId, action: input.action, entityType: input.entityType, entityId: input.entityId, oldData: input.oldData as Prisma.InputJsonValue | undefined, newData: input.newData as Prisma.InputJsonValue | undefined } });
}
