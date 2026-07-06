// src/app/dashboard/DashboardClient.tsx
"use client";
import { useState } from "react";
import UploadFileForm from "./UploadFileForm";
import UserFilesList from "./UserFilesList";
import DriveSyncCard from "./DriveSyncCard";

interface Category { id: string; name: string; color: string | null; }

interface Props {
  categories: Category[];
  isAdmin: boolean;
}

export default function DashboardClient({ categories, isAdmin }: Props) {
  const [refreshSignal, setRefreshSignal] = useState(0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6 items-start">
      {/* Upload form — sticky on desktop */}
      <div className="lg:sticky lg:top-24">
        <UploadFileForm
          categories={categories}
          onUploaded={() => setRefreshSignal((n) => n + 1)}
        />
        
        <DriveSyncCard 
          isAdmin={isAdmin}
          onSynced={() => setRefreshSignal((n) => n + 1)} 
        />
      </div>

      {/* File list */}
      <UserFilesList
        isAdmin={isAdmin}
        categories={categories}
        refreshSignal={refreshSignal}
      />
    </div>
  );
}
