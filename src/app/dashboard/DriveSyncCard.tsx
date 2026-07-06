"use client";
import { useState } from "react";
import { FolderSync, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface Props {
  onSynced: () => void;
  isAdmin: boolean;
}

export default function DriveSyncCard({ onSynced, isAdmin }: Props) {
  const [folderId, setFolderId] = useState("");
  const [isAlbum, setIsAlbum] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<{ synced: number, total: number } | null>(null);

  if (!isAdmin) return null;

  async function handleSync(e: React.FormEvent) {
    e.preventDefault();
    if (!folderId.trim()) return toast.error("Vui lòng nhập ID thư mục");

    setSyncing(true);
    setResult(null);

    try {
      const res = await fetch("/api/sync-gdrive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderId: folderId.trim(), isAlbum })
      });
      const data = await res.json();

      if (res.ok) {
        toast.success(`Đồng bộ thành công ${data.synced} file!`);
        setResult({ synced: data.synced, total: data.totalScanned });
        setFolderId("");
        onSynced();
      } else {
        toast.error(data.error || "Lỗi đồng bộ");
      }
    } catch (err) {
      toast.error("Lỗi kết nối");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="card space-y-4 mt-6">
      <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
        <FolderSync className="w-5 h-5 text-indigo-500" />
        <h2 className="font-bold text-slate-800 text-base">Đồng bộ Google Drive</h2>
      </div>
      
      <p className="text-xs text-slate-500 leading-relaxed">
        Nhập ID thư mục Google Drive để tự động lấy toàn bộ file. Hệ thống sẽ bỏ qua file đã tồn tại và tự động nhận diện chuyên mục.
      </p>

      <form onSubmit={handleSync} className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">ID Thư mục (Folder ID)</label>
          <input
            type="text"
            className="input-field text-sm"
            placeholder="VD: 1Mh7t7Nk506ghcDeXcRT3..."
            value={folderId}
            onChange={(e) => setFolderId(e.target.value)}
            disabled={syncing}
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
          <input 
            type="checkbox" 
            checked={isAlbum}
            onChange={(e) => setIsAlbum(e.target.checked)}
            disabled={syncing}
            className="rounded border-slate-300 text-indigo-500 focus:ring-indigo-500"
          />
          Gộp tất cả file thành 1 Album (Slideshow)
        </label>

        <button
          type="submit"
          disabled={syncing || !folderId.trim()}
          className="w-full flex items-center justify-center gap-2 bg-indigo-500 text-white rounded-xl py-2.5 font-medium hover:bg-indigo-600 transition disabled:opacity-50 text-sm"
        >
          {syncing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Đang đồng bộ...
            </>
          ) : (
            <>
              <FolderSync className="w-4 h-4" /> Bắt đầu đồng bộ
            </>
          )}
        </button>
      </form>

      {result && (
        <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 mt-2">
          <div className="flex items-start gap-2 text-emerald-700">
            <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-medium">Hoàn tất!</p>
              <p className="text-xs mt-0.5 text-emerald-600">Quét được {result.total} file. Đã tải lên mới {result.synced} file.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
