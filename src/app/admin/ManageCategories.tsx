// src/app/admin/ManageCategories.tsx
"use client";
import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, X, Check, FolderOpen } from "lucide-react";
import toast from "react-hot-toast";
import { slugify } from "@/utils/format";

interface Category {
  id: string; name: string; slug: string; description: string | null;
  color: string | null; icon: string | null; sortOrder: number;
  _count: { files: number };
}

const COLORS = ["#3B82F6","#6366F1","#8B5CF6","#EC4899","#EF4444","#F97316","#EAB308","#22C55E","#14B8A6","#06B6D4","#64748B"];

export default function ManageCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [sortOrder, setSortOrder] = useState("0");

  async function fetchCategories() {
    setLoading(true);
    const res = await fetch("/api/categories");
    const data = await res.json();
    setCategories(data.categories ?? []);
    setLoading(false);
  }

  useEffect(() => { fetchCategories(); }, []);

  function openCreate() {
    setEditId(null); setName(""); setDescription(""); setColor(COLORS[0]); setSortOrder("0");
    setShowForm(true);
  }

  function openEdit(cat: Category) {
    setEditId(cat.id); setName(cat.name); setDescription(cat.description ?? "");
    setColor(cat.color ?? COLORS[0]); setSortOrder(String(cat.sortOrder));
    setShowForm(true);
  }

  async function handleSubmit() {
    if (!name.trim()) { toast.error("Tên chuyên mục là bắt buộc"); return; }
    const body = { name: name.trim(), description, color, sortOrder: parseInt(sortOrder) };
    const url = editId ? `/api/categories/${editId}` : "/api/categories";
    const method = editId ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json();
    if (res.ok) {
      toast.success(editId ? "Đã cập nhật chuyên mục" : "Đã tạo chuyên mục");
      setShowForm(false);
      fetchCategories();
    } else {
      toast.error(data.error ?? "Lỗi");
    }
  }

  async function handleDelete(cat: Category) {
    if (!confirm(`Xóa chuyên mục "${cat.name}"? Sẽ xóa ${cat._count.files} tài liệu liên quan.`)) return;
    const res = await fetch(`/api/categories/${cat.id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Đã xóa chuyên mục"); fetchCategories(); }
    else { const d = await res.json(); toast.error(d.error ?? "Lỗi xóa"); }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-slate-700">Quản lý chuyên mục</h3>
        <button onClick={openCreate} className="btn-primary flex items-center gap-1.5 text-sm py-2">
          <Plus className="w-4 h-4" /> Thêm chuyên mục
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="border border-blue-200 bg-blue-50/40 rounded-2xl p-4 space-y-3">
          <h4 className="font-semibold text-slate-700 text-sm">{editId ? "Sửa chuyên mục" : "Tạo chuyên mục mới"}</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tên chuyên mục *" className="input-base text-sm" />
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Mô tả" className="input-base text-sm" />
          </div>
          <div className="flex items-center gap-3">
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-1.5">Màu sắc</p>
              <div className="flex flex-wrap gap-1.5">
                {COLORS.map((c) => (
                  <button key={c} type="button" onClick={() => setColor(c)}
                    className="w-6 h-6 rounded-full border-2 transition-all"
                    style={{ backgroundColor: c, borderColor: color === c ? "#1e293b" : "transparent" }}
                  />
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-1.5">Thứ tự</p>
              <input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}
                className="input-base text-sm w-20" min="0" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSubmit} className="btn-primary text-sm py-2 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> {editId ? "Cập nhật" : "Tạo mới"}
            </button>
            <button onClick={() => setShowForm(false)} className="btn-secondary text-sm py-2 flex items-center gap-1">
              <X className="w-3.5 h-3.5" /> Hủy
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Đang tải…</div>
      ) : categories.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <FolderOpen className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p>Chưa có chuyên mục nào</p>
        </div>
      ) : (
        <div className="space-y-2">
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/60 border border-slate-100 hover:border-slate-200 transition">
              <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color ?? "#3B82F6" }} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800 text-sm">{cat.name}</p>
                {cat.description && <p className="text-xs text-slate-400 truncate">{cat.description}</p>}
              </div>
              <span className="text-xs text-slate-400 shrink-0">{cat._count.files} file</span>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => openEdit(cat)} className="p-1.5 rounded-lg hover:bg-amber-50 text-slate-400 hover:text-amber-600 transition">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(cat)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
