"use client";
import { useState, useRef } from "react";
import { X, Upload, Check } from "lucide-react";
import toast from "react-hot-toast";

interface Category { id: string; name: string; color: string | null; }

interface EditFileModalProps {
  file: any;
  categories: Category[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditFileModal({ file, categories, onClose, onSuccess }: EditFileModalProps) {
  const [title, setTitle] = useState(file.title);
  const [description, setDescription] = useState(file.description || "");
  const [categoryId, setCategoryId] = useState(file.categoryId);
  const [year, setYear] = useState(file.year ? file.year.toString() : new Date().getFullYear().toString());
  const [tags, setTags] = useState(file.tags.map((t: any) => t.tag.name).join(", "));
  const [mode, setMode] = useState<"keep" | "file" | "link">("keep");
  const [newFile, setNewFile] = useState<File | null>(null);
  const [googleDriveLink, setGoogleDriveLink] = useState("");
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !categoryId) return toast.error("Vui lòng nhập tiêu đề và chuyên mục");
    if (mode === "file" && !newFile) return toast.error("Vui lòng chọn file mới");
    if (mode === "link" && !googleDriveLink) return toast.error("Vui lòng nhập link Google Drive");

    setSaving(true);
    const fd = new FormData();
    fd.append("title", title);
    fd.append("description", description);
    fd.append("categoryId", categoryId);
    fd.append("year", year);
    fd.append("tags", tags);

    if (mode === "file" && newFile) fd.append("file", newFile);
    if (mode === "link" && googleDriveLink) fd.append("googleDriveLink", googleDriveLink);

    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;

    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable) setProgress(Math.round((ev.loaded * 100) / ev.total));
    };

    xhr.onload = () => {
      setSaving(false);
      if (xhr.status >= 200 && xhr.status < 300) {
        toast.success("Đã lưu thay đổi");
        onSuccess();
      } else {
        const data = JSON.parse(xhr.responseText);
        toast.error(data.error ?? "Lỗi lưu file");
      }
    };

    xhr.onerror = () => { setSaving(false); toast.error("Lỗi kết nối"); };
    xhr.open("PUT", `/api/files/${file.id}`);
    xhr.send(fd);
  }

  function cancelUpload() {
    xhrRef.current?.abort();
    setSaving(false);
    setProgress(0);
    toast("Đã hủy", { icon: "🚫" });
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <h2 className="font-bold text-lg text-slate-800">Chỉnh sửa tài liệu</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          <form id="edit-form" onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">File đính kèm</label>
              <div className="flex gap-2 p-1.5 bg-slate-100 rounded-xl mb-3">
                <button type="button" onClick={() => setMode("keep")} className={`flex-1 py-1.5 text-sm rounded-lg font-medium transition-colors ${mode === "keep" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:bg-slate-200"}`}>Giữ nguyên gốc</button>
                <button type="button" onClick={() => setMode("file")} className={`flex-1 py-1.5 text-sm rounded-lg font-medium transition-colors ${mode === "file" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:bg-slate-200"}`}>Tải file mới lên</button>
                <button type="button" onClick={() => setMode("link")} className={`flex-1 py-1.5 text-sm rounded-lg font-medium transition-colors ${mode === "link" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:bg-slate-200"}`}>Dán Link GG Drive</button>
              </div>

              {mode === "keep" && (
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-700 flex items-center gap-2 font-medium">
                  <Check className="w-4 h-4" /> Đang dùng file hiện tại: {file.filename}
                </div>
              )}

              {mode === "file" && (
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:bg-slate-50 hover:border-blue-400 transition-colors relative cursor-pointer group bg-white">
                  <input type="file" onChange={(e) => setNewFile(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  <div className="flex flex-col items-center justify-center pointer-events-none">
                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                      <Upload className="w-5 h-5" />
                    </div>
                    {newFile ? <p className="text-sm font-semibold text-blue-600">{newFile.name}</p> : <><p className="text-sm font-semibold text-slate-700">Kéo thả hoặc bấm để chọn file thay thế</p><p className="text-xs text-slate-400 mt-1">Tối đa 500 MB</p></>}
                  </div>
                </div>
              )}

              {mode === "link" && (
                <div className="space-y-2">
                  <input type="url" value={googleDriveLink} onChange={(e) => setGoogleDriveLink(e.target.value)} placeholder="Dán link chia sẻ từ Google Drive vào đây..." className="input-base" required />
                  <p className="text-xs text-slate-500">Mẹo: Đảm bảo link đã được bật quyền "Bất kỳ ai có đường liên kết đều có thể xem". Hệ thống sẽ tự động quét số MB và loại file thay bạn.</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Tiêu đề *</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} className="input-base" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Năm</label>
                <input type="number" value={year} onChange={(e) => setYear(e.target.value)} className="input-base" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Chuyên mục *</label>
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="input-base" required>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Mô tả</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="input-base h-20 resize-none" />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Thẻ (Cách nhau bởi dấu phẩy)</label>
              <input value={tags} onChange={(e) => setTags(e.target.value)} className="input-base" placeholder="vd: Kế hoạch, 2026, Covid" />
            </div>
          </form>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50 shrink-0 rounded-b-2xl">
          {saving ? (
            <div className="space-y-2 max-w-sm ml-auto">
              <div className="flex justify-between text-xs text-slate-500 font-medium"><span>Đang lưu…</span><span>{progress}%</span></div>
              <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden"><div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${progress}%` }} /></div>
              <button type="button" onClick={cancelUpload} className="btn-danger text-xs w-full py-1.5 mt-2">Hủy</button>
            </div>
          ) : (
            <div className="flex justify-end gap-3">
              <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl text-slate-600 font-semibold hover:bg-slate-200 transition-colors">Hủy</button>
              <button type="submit" form="edit-form" className="btn-primary py-2.5">Lưu thay đổi</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
