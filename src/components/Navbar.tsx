// src/components/Navbar.tsx
"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Menu, X, LogOut, LayoutDashboard, ShieldCheck, Home } from "lucide-react";
import toast from "react-hot-toast";
import type { SessionPayload } from "@/lib/auth";

interface NavbarProps {
  session: SessionPayload | null;
}

export default function Navbar({ session }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    toast.success("Đã đăng xuất");
    router.push("/");
    router.refresh();
  }

  const links = [
    { href: "/", label: "Trang chủ", icon: Home },
    ...(session?.role === "ADMIN" || session?.role === "UPLOADER"
      ? [{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }]
      : []),
    ...(session?.role === "ADMIN"
      ? [{ href: "/admin", label: "Quản trị", icon: ShieldCheck }]
      : []),
  ];

  return (
    <header className="sticky top-0 z-50">
      {/* Main navbar */}
      <nav
        className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60"
        style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.03)" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:shadow-blue-500/30 transition-all duration-200 group-hover:scale-105">
              <span className="text-white font-extrabold text-xs tracking-tight">CDC</span>
            </div>
            <div className="hidden sm:flex flex-col leading-none">
              <span className="font-extrabold text-slate-800 text-base tracking-tight">
                CDC<span className="text-blue-600">Media</span>
              </span>
              <span className="text-[9px] font-medium text-slate-400 tracking-widest uppercase">Ngân hàng Tài liệu</span>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1 flex-1 justify-center">
            {links.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href || (href !== "/" && pathname.startsWith(href + "/"));
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200
                    ${isActive
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/15"
                      : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"}`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              );
            })}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-2.5">
            {session ? (
              <>
                <div className="flex flex-col items-end leading-none">
                  <span className="text-sm font-semibold text-slate-700">
                    {session.displayName ?? session.username}
                  </span>
                  <span className="text-[10px] mt-0.5 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold tracking-wide uppercase">
                    {session.role === "ADMIN" ? "Admin" : session.role === "UPLOADER" ? "Uploader" : "Viewer"}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="btn-secondary flex items-center gap-1.5 text-sm text-red-600 border-red-200/60 hover:bg-red-50 hover:border-red-300"
                >
                  <LogOut className="w-4 h-4" /> Đăng xuất
                </button>
              </>
            ) : (
              <Link href="/login" className="btn-primary text-sm">Đăng nhập</Link>
            )}
          </div>

          {/* Mobile toggle — min 44×44 touch target */}
          <button
            className="md:hidden w-11 h-11 flex items-center justify-center rounded-xl hover:bg-slate-100/80 transition-colors"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? "Đóng menu" : "Mở menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="w-5 h-5 text-slate-700" /> : <Menu className="w-5 h-5 text-slate-700" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu — smooth slide down */}
      {mobileOpen && (
        <div
          className="md:hidden bg-white/95 backdrop-blur-xl border-b border-slate-200/60 shadow-lg animate-fade-in"
          role="navigation"
          aria-label="Mobile navigation"
        >
          <div className="max-w-7xl mx-auto px-4 py-3 space-y-1">
            {links.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href || (href !== "/" && pathname.startsWith(href + "/"));
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all min-h-[44px]
                    ${isActive
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm"
                      : "text-slate-700 hover:bg-slate-100/80"}`}
                >
                  <Icon className="w-4 h-4" /> {label}
                </Link>
              );
            })}

            <div className="border-t border-slate-100 pt-2 mt-2">
              {session ? (
                <>
                  <div className="px-4 py-2 flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-700">{session.displayName ?? session.username}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold tracking-wide uppercase">
                      {session.role === "ADMIN" ? "Admin" : session.role === "UPLOADER" ? "Uploader" : "Viewer"}
                    </span>
                  </div>
                  <button
                    onClick={() => { setMobileOpen(false); handleLogout(); }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50/80 min-h-[44px] transition-colors"
                  >
                    <LogOut className="w-4 h-4" /> Đăng xuất
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 text-white min-h-[44px] transition-colors"
                >
                  Đăng nhập
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
