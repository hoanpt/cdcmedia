// src/components/Footer.tsx
import Link from "next/link";
import { MapPin, Phone, Globe, Heart } from "lucide-react";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="relative mt-8 bg-white/80 backdrop-blur-xl border-t border-slate-200/60">
      {/* Gradient accent line */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600 via-indigo-500 to-violet-600 opacity-60" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {/* Brand column */}
          <div className="sm:col-span-1 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20">
                <span className="text-white font-extrabold text-xs tracking-tight">CDC</span>
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-extrabold text-slate-800 text-base tracking-tight">
                  CDC<span className="text-blue-600">Media</span>
                </span>
                <span className="text-[9px] font-medium text-slate-400 tracking-widest uppercase">Ngân hàng Tài liệu</span>
              </div>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed max-w-[200px]">
              Hệ thống quản lý và chia sẻ tài liệu truyền thông sức khỏe cộng đồng.
            </p>
          </div>

          {/* Quick links */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-slate-700 uppercase tracking-widest">Truy cập nhanh</p>
            <nav className="flex flex-col gap-2">
              {[
                { href: "/", label: "Trang chủ" },
                { href: "/dashboard", label: "Dashboard" },
                { href: "/admin", label: "Quản trị" },
                { href: "/login", label: "Đăng nhập" },
              ].map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="text-xs text-slate-500 hover:text-blue-600 transition-colors flex items-center gap-1.5 group"
                >
                  <span className="w-1 h-1 rounded-full bg-slate-300 group-hover:bg-blue-500 transition-colors" />
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Contact */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-slate-700 uppercase tracking-widest">Liên hệ</p>
            <div className="flex flex-col gap-2 text-xs text-slate-500">
              <div className="font-semibold text-slate-700 mb-1">
                Trung tâm Kiểm soát Bệnh tật Thành phố Đà Nẵng
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 mt-0.5 text-blue-500 shrink-0" />
                <span>Trụ sở chính: 118 Lê Đình Lý, Phường Thanh Khê, Thành phố Đà Nẵng</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span>0236 3890 407</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <a href="mailto:kiemsoatbenhtat@danang.gov.vn" className="hover:text-blue-600 transition-colors">
                  kiemsoatbenhtat@danang.gov.vn
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <p>
            © {year}{" "}
            <span className="font-semibold text-slate-600">Trung tâm Kiểm soát Bệnh tật TP. Đà Nẵng</span>
          </p>
          <p className="flex items-center gap-1">
            Phát triển bởi <Heart className="w-3 h-3 text-red-400 inline mx-0.5" /> Bộ phận CNTT – CDC Đà Nẵng
          </p>
        </div>
      </div>
    </footer>
  );
}
