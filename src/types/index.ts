// src/types/index.ts — shared types
export type Role = "ADMIN" | "UPLOADER" | "VIEWER";

export type FileWithRelations = {
  id: string;
  title: string;
  description: string | null;
  filename: string;
  filepath: string;
  driveFileId: string | null;
  driveWebLink: string | null;
  fileType: string;
  fileSize: number;
  downloadCount: number;
  isPublic: boolean;
  year: number | null;
  categoryId: string;
  category: { id: string; name: string; color: string | null; icon: string | null };
  uploaderId: string;
  uploader: { id: string; username: string; displayName: string | null };
  tags: { tag: { id: string; name: string } }[];
  createdAt: Date;
  updatedAt: Date;
};

export type CategoryWithCount = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  sortOrder: number;
  _count: { files: number };
};

export type UserPublic = {
  id: string;
  username: string;
  displayName: string | null;
  role: Role;
  isActive: boolean;
  createdAt: Date;
  _count?: { files: number };
};

export type SiteStats = {
  totalFiles: number;
  totalCategories: number;
  totalUsers: number;
  totalStorageBytes: number;
  totalDownloads: number;
  storageMode: "local" | "drive";
};
