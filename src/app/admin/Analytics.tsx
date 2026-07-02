// src/app/admin/Analytics.tsx
// Dashboard thống kê & phân tích dữ liệu truyền thông cho Admin
"use client";
import { useEffect, useState, useCallback } from "react";
import {
  TrendingUp, Download, FileArchive, AlertTriangle,
  Star, BarChart3, RefreshCw, Trophy, Users,
  Clock, Eye, ChevronUp, ChevronDown, Minus,
} from "lucide-react";
import { formatFileSize, formatDate } from "@/utils/format";
import { clsx } from "clsx";

// ── Types ───────────────────────────────────────────────────────────────────
type Overview = {
  totalFiles: number; totalPublic: number; totalPrivate: number;
  totalDownloads: number; totalSizeMB: number;
  recentFiles: number; zeroDownload: number; zeroDownloadPct: number;
};
type TopFile = {
  id: string; title: string; fileType: string;
  downloadCount: number; fileSize: number; createdAt: string;
  isPublic: boolean; score: number;
  category: { name: string; color: string | null };
};
type CatStat = {
  id: string; name: string; color: string | null; icon: string | null;
  fileCount: number; publicCount: number;
  totalDownloads: number; sizeMB: number; avgDownloads: number;
};
type UploadPoint = { month: string; count: number; sizeMB: number };
type TypeBreakdown = { label: string; count: number; downloads: number; sizeMB: number };
type UploaderStat = { id: string; name: string; role: string; fileCount: number; totalDownloads: number };

type Analytics = {
  overview: Overview;
  topFiles: TopFile[];
  categoryStats: CatStat[];
  uploadTrend: UploadPoint[];
  fileTypeBreakdown: TypeBreakdown[];
  uploaderStats: UploaderStat[];
};

// ── Helpers ─────────────────────────────────────────────────────────────────
function formatMonth(key: string) {
  const [y, m] = key.split("-");
  const months = ["T1","T2","T3","T4","T5","T6","T7","T8","T9","T10","T11","T12"];
  return `${months[Number(m) - 1]}/${y}`;
}

function Bar({ value, max, color = "bg-blue-500" }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-slate-500 w-8 text-right shrink-0">{pct}%</span>
    </div>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const cls = score >= 80 ? "bg-emerald-100 text-emerald-700" :
    score >= 50 ? "bg-blue-100 text-blue-700" :
    score >= 20 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500";
  return <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${cls}`}>{score}%</span>;
}

function Trend({ value, label }: { value: number; label: string }) {
  const Icon = value > 0 ? ChevronUp : value < 0 ? ChevronDown : Minus;
  const cls = value > 0 ? "text-emerald-600" : value < 0 ? "text-red-500" : "text-slate-400";
  return (
    <span className={`flex items-center gap-0.5 text-xs font-medium ${cls}`}>
      <Icon className="w-3 h-3" />{Math.abs(value)}{label}
    </span>
  );
}

const TYPE_COLORS: Record<string, string> = {
  "Hình ảnh": "bg-pink-400", "Video": "bg-violet-500", "PDF": "bg-red-400",
  "Word": "bg-blue-400", "Excel": "bg-emerald-400", "PowerPoint": "bg-orange-400",
  "Âm thanh": "bg-yellow-400", "Khác": "bg-slate-300",
};

// ── Sections ─────────────────────────────────────────────────────────────────

function OverviewCards({ ov }: { ov: Overview }) {
  const cards = [
    { label: "Tổng tài liệu", value: ov.totalFiles, sub: `${ov.totalPublic} công khai`, icon: FileArchive, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Lượt tải tổng", value: ov.totalDownloads.toLocaleString("vi"), sub: "tất cả thời gian", icon: Download, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Mới 30 ngày", value: ov.recentFiles, sub: "tài liệu mới", icon: Clock, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "Chưa có lượt tải", value: `${ov.zeroDownloadPct}%`, sub: `${ov.zeroDownload} tài liệu`, icon: AlertTriangle, color: ov.zeroDownloadPct > 30 ? "text-amber-600" : "text-slate-500", bg: ov.zeroDownloadPct > 30 ? "bg-amber-50" : "bg-slate-50" },
  ];
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {cards.map(c => (
        <div key={c.label} className="card p-4 flex items-start gap-3">
          <div className={`p-2 rounded-xl ${c.bg} shrink-0`}>
            <c.icon className={`w-4 h-4 ${c.color}`} />
          </div>
          <div className="min-w-0">
            <p className={`text-lg sm:text-xl font-bold ${c.color} leading-none`}>{c.value}</p>
            <p className="text-xs text-slate-500 mt-0.5 leading-tight">{c.label}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{c.sub}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function TopFilesTable({ files }: { files: TopFile[] }) {
  const maxDl = files[0]?.downloadCount ?? 1;
  return (
    <div className="card p-0 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
        <Trophy className="w-4 h-4 text-amber-500" />
        <h3 className="font-bold text-slate-800">Top tài liệu được tải nhiều nhất</h3>
        <span className="text-xs text-slate-400 ml-auto">Dữ liệu thực tế · Gợi ý tập trung sản xuất</span>
      </div>
      {files.length === 0 ? (
        <p className="text-center text-slate-400 text-sm py-10">Chưa có dữ liệu</p>
      ) : (
        <div className="divide-y divide-slate-50">
          {files.map((f, i) => (
            <div key={f.id} className="px-4 sm:px-5 py-3 flex items-center gap-3 hover:bg-slate-50/50 transition-colors">
              {/* Rank */}
              <div className={clsx(
                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                i === 0 ? "bg-amber-400 text-white" :
                i === 1 ? "bg-slate-300 text-slate-700" :
                i === 2 ? "bg-amber-600/70 text-white" : "bg-slate-100 text-slate-500"
              )}>
                {i + 1}
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{f.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full text-white font-medium"
                    style={{ backgroundColor: f.category.color ?? "#3B82F6" }}>
                    {f.category.name}
                  </span>
                  <span className="text-[10px] text-slate-400">{formatFileSize(f.fileSize)}</span>
                  <span className="text-[10px] text-slate-400">{formatDate(new Date(f.createdAt))}</span>
                </div>
                {/* Bar */}
                <div className="mt-1.5 hidden sm:block">
                  <Bar value={f.downloadCount} max={maxDl} color={i < 3 ? "bg-amber-400" : "bg-blue-400"} />
                </div>
              </div>
              {/* Stats */}
              <div className="flex items-center gap-3 shrink-0 text-right">
                <div>
                  <p className="text-sm font-bold text-slate-700">{f.downloadCount.toLocaleString("vi")}</p>
                  <p className="text-[10px] text-slate-400">lượt tải</p>
                </div>
                <ScoreBadge score={f.score} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CategoryAnalysis({ cats }: { cats: CatStat[] }) {
  const maxDl = Math.max(...cats.map(c => c.totalDownloads), 1);
  const maxFiles = Math.max(...cats.map(c => c.fileCount), 1);

  // Phân loại: Hot / Bình thường / Cần chú ý
  function getStatus(cat: CatStat) {
    const dlRatio = cat.totalDownloads / maxDl;
    const fileRatio = cat.fileCount / maxFiles;
    if (dlRatio > 0.5) return { label: "🔥 Nổi bật", cls: "bg-red-100 text-red-700" };
    if (dlRatio > 0.2) return { label: "✅ Tốt", cls: "bg-emerald-100 text-emerald-700" };
    if (fileRatio > 0.3 && dlRatio < 0.1) return { label: "⚠️ Cần cải thiện", cls: "bg-amber-100 text-amber-700" };
    return { label: "📂 Bình thường", cls: "bg-slate-100 text-slate-600" };
  }

  return (
    <div className="card p-0 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-blue-500" />
        <h3 className="font-bold text-slate-800">Phân tích theo chuyên mục</h3>
        <span className="text-xs text-slate-400 ml-auto">Định hướng đầu tư nội dung</span>
      </div>
      <div className="divide-y divide-slate-50">
        {cats.map(cat => {
          const status = getStatus(cat);
          return (
            <div key={cat.id} className="px-4 sm:px-5 py-3.5">
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color ?? "#3B82F6" }} />
                  <p className="font-semibold text-sm text-slate-800 truncate">{cat.name}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${status.cls}`}>
                    {status.label}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center mb-2">
                <div>
                  <p className="text-sm font-bold text-slate-700">{cat.fileCount}</p>
                  <p className="text-[10px] text-slate-400">tài liệu</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-blue-600">{cat.totalDownloads.toLocaleString("vi")}</p>
                  <p className="text-[10px] text-slate-400">lượt tải</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-indigo-600">{cat.avgDownloads}</p>
                  <p className="text-[10px] text-slate-400">TB/file</p>
                </div>
              </div>
              <Bar value={cat.totalDownloads} max={maxDl} color="bg-blue-400" />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FileTypeChart({ types }: { types: TypeBreakdown[] }) {
  const total = types.reduce((s, t) => s + t.count, 0);
  const maxDl = Math.max(...types.map(t => t.downloads), 1);
  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Eye className="w-4 h-4 text-violet-500" />
        <h3 className="font-bold text-slate-800">Phân bố loại tài liệu</h3>
      </div>
      {/* Visual bar chart */}
      <div className="flex h-10 rounded-xl overflow-hidden gap-0.5">
        {types.map(t => {
          const pct = total > 0 ? (t.count / total) * 100 : 0;
          if (pct < 1) return null;
          const color = TYPE_COLORS[t.label] ?? "bg-slate-300";
          return (
            <div
              key={t.label}
              className={`${color} flex items-center justify-center text-white text-[9px] font-bold transition-all`}
              style={{ width: `${pct}%` }}
              title={`${t.label}: ${t.count} file`}
            >
              {pct > 8 ? t.label : ""}
            </div>
          );
        })}
      </div>
      {/* Table */}
      <div className="space-y-2">
        {types.map(t => (
          <div key={t.label} className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${TYPE_COLORS[t.label] ?? "bg-slate-300"}`} />
            <span className="text-xs text-slate-600 w-20 shrink-0">{t.label}</span>
            <div className="flex-1">
              <Bar value={t.downloads} max={maxDl} color={TYPE_COLORS[t.label]?.replace("bg-", "bg-") ?? "bg-slate-300"} />
            </div>
            <span className="text-xs text-slate-500 w-8 text-right shrink-0">{t.count}</span>
            <span className="text-xs font-semibold text-blue-600 w-16 text-right shrink-0">{t.downloads.toLocaleString("vi")} ↓</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function UploadTrend({ data }: { data: UploadPoint[] }) {
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-emerald-500" />
        <h3 className="font-bold text-slate-800">Xu hướng đăng tải (90 ngày gần nhất)</h3>
      </div>
      {data.length === 0 ? (
        <p className="text-slate-400 text-sm text-center py-6">Chưa có dữ liệu</p>
      ) : (
        <>
          {/* Mini bar chart */}
          <div className="flex items-end gap-1.5 h-24">
            {data.map(d => {
              const pct = max > 0 ? (d.count / max) * 100 : 0;
              return (
                <div key={d.month} className="flex-1 flex flex-col items-center gap-1 group cursor-pointer">
                  <div className="relative flex-1 w-full flex items-end">
                    <div
                      className="w-full bg-blue-400 hover:bg-blue-500 rounded-t transition-colors"
                      style={{ height: `${Math.max(pct, 4)}%` }}
                      title={`${formatMonth(d.month)}: ${d.count} file, ${d.sizeMB}MB`}
                    />
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center z-10">
                      <div className="bg-slate-800 text-white text-[10px] rounded px-2 py-1 whitespace-nowrap">
                        {d.count} file · {d.sizeMB}MB
                      </div>
                      <div className="w-2 h-2 bg-slate-800 rotate-45 -mt-1" />
                    </div>
                  </div>
                  <span className="text-[9px] text-slate-400 whitespace-nowrap">{formatMonth(d.month)}</span>
                </div>
              );
            })}
          </div>
          {/* Summary row */}
          <div className="flex justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
            <span>Tổng: <strong className="text-slate-700">{data.reduce((s,d) => s+d.count, 0)}</strong> file</span>
            <span>Dung lượng: <strong className="text-slate-700">{data.reduce((s,d) => s+d.sizeMB, 0).toFixed(1)}MB</strong></span>
            <span>Trung bình: <strong className="text-slate-700">{data.length > 0 ? Math.round(data.reduce((s,d) => s+d.count, 0)/data.length) : 0}</strong> file/tháng</span>
          </div>
        </>
      )}
    </div>
  );
}

function UploaderTable({ stats }: { stats: UploaderStat[] }) {
  const maxFiles = Math.max(...stats.map(u => u.fileCount), 1);
  return (
    <div className="card p-0 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
        <Users className="w-4 h-4 text-indigo-500" />
        <h3 className="font-bold text-slate-800">Đóng góp theo thành viên</h3>
      </div>
      {stats.length === 0 ? (
        <p className="text-center text-slate-400 text-sm py-10">Chưa có dữ liệu</p>
      ) : (
        <div className="divide-y divide-slate-50">
          {stats.map((u, i) => (
            <div key={u.id} className="px-4 sm:px-5 py-3 flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {u.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-semibold text-slate-700 truncate">{u.name}</p>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 shrink-0">
                    {u.role === "ADMIN" ? "Admin" : u.role === "UPLOADER" ? "Uploader" : "Viewer"}
                  </span>
                </div>
                <Bar value={u.fileCount} max={maxFiles} color="bg-indigo-400" />
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-slate-700">{u.fileCount}</p>
                <p className="text-[10px] text-slate-400">{u.totalDownloads} ↓</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Recommendations({ data }: { data: Analytics }) {
  const recs: { icon: string; title: string; desc: string; priority: "high" | "medium" | "low" }[] = [];

  // Zero-download rate cao
  if (data.overview.zeroDownloadPct > 40) {
    recs.push({ icon: "⚠️", priority: "high", title: "Nhiều tài liệu chưa được tải", desc: `${data.overview.zeroDownloadPct}% tài liệu chưa có lượt tải nào. Cần review lại tiêu đề, mô tả hoặc nâng cao khả năng tìm kiếm.` });
  }

  // Chuyên mục nổi bật → nên đầu tư thêm
  const topCat = data.categoryStats[0];
  if (topCat) {
    recs.push({ icon: "🚀", priority: "high", title: `Tập trung vào "${topCat.name}"`, desc: `Đây là chuyên mục được tải nhiều nhất (${topCat.totalDownloads.toLocaleString("vi")} lượt). Nên ưu tiên sản xuất thêm nội dung cho chuyên mục này.` });
  }

  // Chuyên mục có nhiều file nhưng ít tải
  const underperform = data.categoryStats.find(c => c.fileCount > 3 && c.avgDownloads < 2);
  if (underperform) {
    recs.push({ icon: "📉", priority: "medium", title: `Cải thiện nội dung "${underperform.name}"`, desc: `Chuyên mục có ${underperform.fileCount} tài liệu nhưng trung bình chỉ ${underperform.avgDownloads} lượt tải/file. Nên cập nhật lại nội dung hoặc cải thiện SEO nội bộ.` });
  }

  // Loại file phổ biến nhất
  const topType = data.fileTypeBreakdown[0];
  if (topType) {
    recs.push({ icon: "📌", priority: "low", title: `Định dạng ${topType.label} chiếm ưu thế`, desc: `${topType.count} file ${topType.label} với ${topType.downloads.toLocaleString("vi")} lượt tải. Cân nhắc đảm bảo chất lượng và tính nhất quán của định dạng này.` });
  }

  // Upload trend giảm
  if (data.uploadTrend.length >= 2) {
    const last = data.uploadTrend[data.uploadTrend.length - 1];
    const prev = data.uploadTrend[data.uploadTrend.length - 2];
    if (last.count < prev.count * 0.5) {
      recs.push({ icon: "📅", priority: "medium", title: "Tần suất đăng tải giảm", desc: `Tháng gần nhất chỉ đăng ${last.count} file (so với ${prev.count} tháng trước). Nên lên kế hoạch sản xuất nội dung đều đặn hơn.` });
    }
  }

  const prioColor = { high: "border-red-200 bg-red-50", medium: "border-amber-200 bg-amber-50", low: "border-slate-200 bg-slate-50" };

  return (
    <div className="card p-5 space-y-3">
      <div className="flex items-center gap-2">
        <Star className="w-4 h-4 text-amber-500" />
        <h3 className="font-bold text-slate-800">Khuyến nghị cho quản trị viên</h3>
      </div>
      {recs.length === 0 ? (
        <p className="text-slate-400 text-sm">Chưa đủ dữ liệu để đưa ra khuyến nghị</p>
      ) : (
        <div className="space-y-2.5">
          {recs.map((r, i) => (
            <div key={i} className={`border rounded-2xl p-3.5 ${prioColor[r.priority]}`}>
              <div className="flex items-start gap-2">
                <span className="text-lg leading-none mt-0.5">{r.icon}</span>
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{r.title}</p>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{r.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function Analytics() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/analytics");
      if (res.ok) {
        setData(await res.json());
        setLastUpdated(new Date());
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-400" />
        <p className="text-sm">Đang phân tích dữ liệu…</p>
      </div>
    );
  }

  if (!data) return <p className="text-center text-slate-400 py-10">Không tải được dữ liệu</p>;

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-400">
          {lastUpdated ? `Cập nhật lúc ${lastUpdated.toLocaleTimeString("vi-VN")}` : ""}
        </p>
        <button
          onClick={load}
          disabled={loading}
          className="btn-secondary flex items-center gap-1.5 text-xs"
        >
          <RefreshCw className={clsx("w-3 h-3", loading && "animate-spin")} />
          Làm mới
        </button>
      </div>

      {/* Overview */}
      <OverviewCards ov={data.overview} />

      {/* Khuyến nghị — hiện sớm */}
      <Recommendations data={data} />

      {/* Top files */}
      <TopFilesTable files={data.topFiles} />

      {/* 2 col: Category + Type */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <CategoryAnalysis cats={data.categoryStats} />
        <div className="space-y-5">
          <FileTypeChart types={data.fileTypeBreakdown} />
          <UploadTrend data={data.uploadTrend} />
        </div>
      </div>

      {/* Uploader */}
      <UploaderTable stats={data.uploaderStats} />
    </div>
  );
}
