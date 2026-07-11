// src/app/dashboard/UploadFileForm.tsx
"use client";
import { useState, useRef, FormEvent, useEffect } from "react";
import { Upload, X, FileText, Tag, Calendar, Sparkles } from "lucide-react";
import toast from "react-hot-toast";
import { formatFileSize } from "@/utils/format";

interface Category { id: string; name: string; color: string | null; group: string | null; }

interface Props {
  categories: Category[];
  onUploaded: () => void;
}

export default function UploadFileForm({ categories, onUploaded }: Props) {
  const [files, setFiles] = useState<File[]>([]);
  const [googleDriveLink, setGoogleDriveLink] = useState("");
  const [mode, setMode] = useState<"file" | "link">("file");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [tags, setTags] = useState("");
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [autoDescribe, setAutoDescribe] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  // Auto-fill title from filename
  useEffect(() => {
    if (files.length > 0 && !title) {
      setTitle(files[0].name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "));
    }
  }, [files, title]);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files);
    if (dropped.length > 0) setFiles((prev) => [...prev, ...dropped]);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (mode === "file" && files.length === 0) return;
    if (mode === "link" && !googleDriveLink) return;
    if (!title || !categoryId) return;

    setUploading(true);
    setProgress(0);

    const fd = new FormData();
    if (mode === "file") {
      files.forEach(f => fd.append("file", f));
    }
    if (mode === "link" && googleDriveLink) fd.append("googleDriveLink", googleDriveLink);
    fd.append("title", title);
    fd.append("description", description);
    fd.append("categoryId", categoryId);
    fd.append("tags", tags);
    fd.append("year", year);
    if (autoDescribe) fd.append("autoDescribe", "true");

    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;

    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable) setProgress(Math.round((ev.loaded / ev.total) * 100));
    };

    xhr.onload = () => {
      setUploading(false);
      if (xhr.status === 201) {
        toast.success("Tải lên thành công!");
        setFiles([]);
        setGoogleDriveLink("");
        setTitle("");
        setDescription("");
        setTags("");
        setYear(String(new Date().getFullYear()));
        setCategoryId(categories[0]?.id ?? "");
        setProgress(0);
        onUploaded();
      } else {
        const data = JSON.parse(xhr.responseText);
        toast.error(data.error ?? "Lỗi tải lên");
      }
    };

    xhr.onerror = () => { setUploading(false); toast.error("Lỗi kết nối"); };

    xhr.open("POST", "/api/files");
    xhr.send(fd);
  }

  function cancelUpload() {
    xhrRef.current?.abort();
    setUploading(false);
    setProgress(0);
    toast("Đã hủy tải lên", { icon: "🚫" });
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">
          <Upload className="w-5 h-5 text-blue-600" /> Tải lên tài liệu
        </h2>
        
        {/* Toggle Mode */}
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setMode("file")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${mode === "file" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            Từ Máy tính
          </button>
          <button
            type="button"
            onClick={() => setMode("link")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${mode === "link" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            Link Google Drive
          </button>
        </div>
      </div>

      {/* Upload Zone or Link Input */}
      {mode === "file" ? (
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-2xl p-6
                   flex flex-col items-center gap-2 cursor-pointer transition-colors text-center
                   bg-slate-50/50 hover:bg-blue-50/30"
      >
        {files.length > 0 ? (
          <div className="text-center w-full">
            <FileText className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">{files.length} file đã chọn</p>
            <div className="mt-2 text-xs text-slate-500 max-h-24 overflow-y-auto space-y-1 text-left px-4">
              {files.map((f, i) => (
                <div key={i} className="truncate">• {f.name} ({formatFileSize(f.size)})</div>
              ))}
            </div>
            <p className="text-xs text-blue-600 mt-2">Bấm để chọn lại</p>
          </div>
        ) : (
          <>
            <Upload className="w-8 h-8 text-slate-300" />
            <p className="text-sm text-slate-500">Kéo thả file hoặc <span className="text-blue-600 font-semibold">chọn file</span></p>
            <p className="text-xs text-slate-400 mt-1">Hỗ trợ: Word, Excel, PDF, PowerPoint, Hình ảnh (JPG, PNG), Video (MP4), Audio (MP3), Nén (ZIP, RAR)<br/>Tối đa 500 MB / file</p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.webp,.mp4,.avi,.mkv,.mp3,.wav,.zip,.rar"
          onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
        />
      </div>
      ) : (
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Đường dẫn Google Drive *</label>
          <input
            type="url"
            value={googleDriveLink}
            onChange={(e) => setGoogleDriveLink(e.target.value)}
            placeholder="Dán link Google Drive (ví dụ: https://drive.google.com/file/d/...)"
            className="input-base"
            required={mode === "link"}
          />
          <p className="text-xs text-slate-500 mt-2">Mẹo: Hệ thống sẽ tự động quét thông tin file (số MB, hình đại diện) nếu link của bạn đã được bật "Bất kỳ ai có đường liên kết đều có thể xem".</p>
        </div>
      )}

      {/* Title */}
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1">Tiêu đề *</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Nhập tiêu đề tài liệu"
          className="input-base"
          required
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm font-medium text-slate-700">Mô tả tài liệu</label>
          <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full transition-colors border border-indigo-100">
            <input 
              type="checkbox" 
              checked={autoDescribe} 
              onChange={(e) => setAutoDescribe(e.target.checked)} 
              className="rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500 w-3 h-3 cursor-pointer"
            />
            <Sparkles className="w-3 h-3" />
            Tự động tạo bằng AI
          </label>
        </div>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Viết một đoạn giới thiệu ngắn..."
          rows={3}
          className="input-base resize-none"
        />
      </div>

      {/* Category + Year */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Chuyên mục *</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="input-base"
            required
          >
            {["VIDEO", "AUDIO", "GRAPHICS", "DOCUMENTS"].map(grpId => {
              const grpCats = categories.filter(c => c.group === grpId);
              if (grpCats.length === 0) return null;
              const grpName = grpId === "VIDEO" ? "Thư viện Video" : grpId === "AUDIO" ? "Âm thanh & Podcast" : grpId === "GRAPHICS" ? "Ấn phẩm & Hình ảnh" : "Tài liệu & Khai thác dữ liệu";
              return (
                <optgroup key={grpId} label={grpName}>
                  {grpCats.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </optgroup>
              );
            })}
            {categories.filter(c => !c.group).map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            <Calendar className="inline w-3 h-3 mr-1" />Năm
          </label>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            min="2000"
            max={new Date().getFullYear() + 1}
            className="input-base"
          />
        </div>
      </div>

      {/* Tags */}
      {/* Tags */}
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1">
          <Tag className="inline w-3 h-3 mr-1" />Thẻ (Khoa/Phòng hoặc từ khóa)
        </label>
        <input
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="vd: sốt xuất huyết, phòng dịch, 2025"
          className="input-base mb-2"
        />
        {/* 16 Thẻ Khoa/Phòng CDC */}
        <div className="flex flex-wrap gap-1.5">
          {[
            "Tổ chức - Hành chính",
            "Kế hoạch - Tài chính",
            "Kế hoạch - Nghiệp vụ",
            "PC bệnh truyền nhiễm",
            "PC HIV/AIDS",
            "PC bệnh không lây nhiễm",
            "Sức khỏe môi trường - Y tế trường học",
            "Sức khỏe sinh sản",
            "Dinh dưỡng",
            "Kiểm dịch y tế quốc tế",
            "Ký sinh trùng - Côn trùng",
            "Truyền thông",
            "Xét nghiệm",
            "Dược - Vật tư y tế",
            "Phòng Khám đa khoa",
            "Bệnh nghề nghiệp",
            "Sốt xuất huyết",
            "Tay chân miệng",
            "Sởi",
            "Tiêm chủng",
            "An toàn thực phẩm",
            "Covid-19"
          ].map(t => {
            const currentTags = tags.split(",").map(x => x.trim()).filter(Boolean);
            const active = currentTags.includes(t);
            return (
              <button
                type="button"
                key={t}
                onClick={() => {
                  if (active) {
                    setTags(currentTags.filter(x => x !== t).join(", "));
                  } else {
                    setTags([...currentTags, t].join(", "));
                  }
                }}
                className={`px-2 py-1 text-[10px] sm:text-[11px] rounded-lg border transition-colors ${active ? "bg-blue-100 border-blue-300 text-blue-700 font-semibold shadow-sm" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"}`}
              >
                {t}
              </button>
            )
          })}
        </div>
      </div>

      {/* Progress */}
      {uploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-slate-500">
            <span>Đang tải lên…</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <button type="button" onClick={cancelUpload} className="btn-danger text-xs w-full py-1.5">
            Hủy tải lên
          </button>
        </div>
      )}

      {!uploading && (
        <button type="submit" disabled={(mode === "file" && files.length === 0) || (mode === "link" && !googleDriveLink) || !title || !categoryId} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
          <Upload className="w-4 h-4" /> Tải lên
        </button>
      )}
    </form>
  );
}
