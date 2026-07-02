// src/components/Footer.tsx
export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-white/80 backdrop-blur-xl border-t border-slate-200/60 mt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-slate-500">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
            <span className="text-white font-bold text-[10px]">CDC</span>
          </div>
          <span>
            <strong className="text-slate-700">CDC Media</strong> – Ngân hàng Tài liệu Truyền thông
          </span>
        </div>
        <div className="text-center sm:text-right">
          <p>Trung tâm Kiểm soát Bệnh tật TP. Đà Nẵng © {year}</p>
          <p className="text-xs text-slate-400 mt-0.5">Bộ phận Công nghệ thông tin – CDC Đà Nẵng</p>
        </div>
      </div>
    </footer>
  );
}
