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
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-sm">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow">
            <span className="text-white font-bold text-xs">CDC</span>
          </div>
          <span className="font-bold text-slate-800 hidden sm:block">
            CDC<span className="text-blue-600">Media</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1 flex-1 justify-center">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all
                ${pathname === href || pathname.startsWith(href + "/")
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-slate-600 hover:bg-white/80 hover:text-slate-900"}`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="hidden md:flex items-center gap-2">
          {session ? (
            <>
              <span className="text-sm text-slate-500 font-medium">
                {session.displayName ?? session.username}
                <span className="ml-1.5 text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold">
                  {session.role === "ADMIN" ? "Admin" : session.role === "UPLOADER" ? "Uploader" : "Viewer"}
                </span>
              </span>
              <button onClick={handleLogout} className="btn-secondary flex items-center gap-1.5 text-sm">
                <LogOut className="w-4 h-4" /> Đăng xuất
              </button>
            </>
          ) : (
            <Link href="/login" className="btn-primary text-sm">Đăng nhập</Link>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-2 rounded-xl hover:bg-white/60 transition"
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-xl border-t border-slate-200/60 px-4 pb-4 pt-2 space-y-1">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all
                ${pathname === href ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-white/60"}`}
            >
              <Icon className="w-4 h-4" /> {label}
            </Link>
          ))}
          {session ? (
            <button
              onClick={() => { setMobileOpen(false); handleLogout(); }}
              className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4" /> Đăng xuất
            </button>
          ) : (
            <Link href="/login" onClick={() => setMobileOpen(false)}
              className="block px-4 py-2.5 rounded-xl text-sm font-medium text-blue-600 hover:bg-blue-50">
              Đăng nhập
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
