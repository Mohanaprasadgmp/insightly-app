import { db } from "@/lib/db";
import { ActivityType } from "@prisma/client";

export async function logActivity(params: {
  agencyId: string;
  userId: string;
  type: ActivityType;
  entityId?: string;
  meta?: Record<string, string>;
}) {
  try {
    await db.activity.create({
      data: {
        agencyId: params.agencyId,
        userId: params.userId,
        type: params.type,
        entityId: params.entityId ?? null,
        meta: params.meta ?? {},
      },
    });
  } catch {
    // Activity logging is non-critical — never fail the main operation
  }
}
