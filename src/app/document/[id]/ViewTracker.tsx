"use client";
import { useEffect } from "react";

export default function ViewTracker({ fileId }: { fileId: string }) {
  useEffect(() => {
    // Only count once per session for this file to prevent spam
    const viewedKey = `viewed_${fileId}`;
    if (!sessionStorage.getItem(viewedKey)) {
      fetch(`/api/files/${fileId}/view`, { method: "POST" })
        .then(res => {
          if (res.ok) sessionStorage.setItem(viewedKey, "true");
        })
        .catch(console.error);
    }
  }, [fileId]);

  return null;
}
