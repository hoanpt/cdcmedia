// src/lib/logger.ts — activity log helper
import { prisma } from "@/lib/prisma";
type LogAction =
  | "UPLOAD" | "DELETE" | "UPDATE" | "LOGIN" | "LOGOUT" | "DOWNLOAD"
  | "UPDATE_SETTINGS" | "CREATE_CATEGORY" | "DELETE_CATEGORY"
  | "CREATE_USER" | "DELETE_USER" | "CHANGE_PASSWORD";

export async function logActivity(
  userId: string | null,
  action: LogAction,
  details?: string,
  ipAddress?: string
): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: {
        action,
        details,
        userId: userId ?? undefined,
        ipAddress,
      },
    });
  } catch {
    // non-blocking — log failure should not crash request
    console.error("[logger] Failed to write activity log");
  }
}
