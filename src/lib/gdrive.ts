// src/lib/gdrive.ts — Google Drive integration
import { google } from "googleapis";
import { prisma } from "@/lib/prisma";
import { Readable } from "stream";

export type DriveSettings = {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  folderId?: string;
};

export async function getDriveSettings(): Promise<DriveSettings | null> {
  const settings = await prisma.appSetting.findMany({
    where: {
      key: { in: ["gdrive_client_id", "gdrive_client_secret", "gdrive_refresh_token", "gdrive_folder_id"] },
    },
  });

  const map = Object.fromEntries(settings.map((s: any) => [s.key, s.value]));

  if (!map.gdrive_client_id || !map.gdrive_client_secret || !map.gdrive_refresh_token) {
    return null;
  }

  return {
    clientId: map.gdrive_client_id,
    clientSecret: map.gdrive_client_secret,
    refreshToken: map.gdrive_refresh_token,
    folderId: map.gdrive_folder_id,
  };
}

export async function isDriveConfigured(): Promise<boolean> {
  const settings = await getDriveSettings();
  return settings !== null;
}

export async function getDriveClient() {
  const settings = await getDriveSettings();
  if (!settings) throw new Error("Google Drive not configured");

  const oauth2 = new google.auth.OAuth2(settings.clientId, settings.clientSecret);
  oauth2.setCredentials({ refresh_token: settings.refreshToken });
  return { drive: google.drive({ version: "v3", auth: oauth2 } as any) as any, settings };
}

export async function getDriveAccessToken(): Promise<string> {
  const settings = await getDriveSettings();
  if (!settings) throw new Error("Google Drive not configured");
  const oauth2 = new google.auth.OAuth2(settings.clientId, settings.clientSecret);
  oauth2.setCredentials({ refresh_token: settings.refreshToken });
  const token = await oauth2.getAccessToken();
  if (!token.token) throw new Error("Cannot get Drive access token");
  return token.token;
}

export async function uploadToDrive(
  buffer: Buffer,
  filename: string,
  mimeType: string,
  folderId?: string
): Promise<{ fileId: string; webViewLink: string }> {
  const { drive, settings } = await getDriveClient();

  const response = await drive.files.create({
    requestBody: {
      name: filename,
      parents: folderId ?? settings.folderId ? [folderId ?? settings.folderId!] : undefined,
    },
    media: {
      mimeType,
      body: Readable.from(buffer),
    },
    fields: "id, webViewLink",
  });

  const fileId = response.data.id!;

  // Make public
  await drive.permissions.create({
    fileId,
    requestBody: { role: "reader", type: "anyone" },
  });

  return {
    fileId,
    webViewLink: response.data.webViewLink ?? `https://drive.google.com/file/d/${fileId}/view`,
  };
}

export async function downloadFromDrive(fileId: string): Promise<{ data: NodeJS.ReadableStream; contentType: string; contentLength?: number }> {
  const { drive } = await getDriveClient();

  const meta = await drive.files.get({ fileId, fields: "mimeType, size" });
  const contentType = meta.data.mimeType ?? "application/octet-stream";
  const contentLength = meta.data.size ? parseInt(meta.data.size) : undefined;

  const res = await drive.files.get(
    { fileId, alt: "media" },
    { responseType: "stream" }
  );

  return { data: res.data as unknown as NodeJS.ReadableStream, contentType, contentLength };
}

export async function deleteFromDrive(fileId: string): Promise<void> {
  const { drive } = await getDriveClient();
  await drive.files.delete({ fileId });
}

export async function getDriveStorageInfo(): Promise<{ email: string; used: number; total: number }> {
  const { drive } = await getDriveClient();
  const res = await drive.about.get({ fields: "user, storageQuota" });
  return {
    email: res.data.user?.emailAddress ?? "unknown",
    used: parseInt(res.data.storageQuota?.usage ?? "0"),
    total: parseInt(res.data.storageQuota?.limit ?? "0"),
  };
}
