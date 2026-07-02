// src/components/SidebarAds.tsx
// Sidebar dọc chạy trượt 2 bên màn hình (Căn lề sát nội dung chính)
"use client";
import { useEffect, useState } from "react";
import { X } from "lucide-react";

type Ad = {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl: string | null;
};

export default function SidebarAds() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/sidebar-ads")
      .then((r) => r.json())
      .then(setAds)
      .catch(() => {});
  }, []);

  const visible = ads.filter((a) => !dismissed.has(a.id));
  if (!visible.length) return null;

  // Chia đều quảng cáo ra 2 bên, nếu chỉ có 1 quảng cáo thì nhân đôi đối xứng cho đẹp mắt
  let leftAds = visible.filter((_, i) => i % 2 === 0);
  let rightAds = visible.filter((_, i) => i % 2 !== 0);

  if (visible.length === 1) {
    leftAds = [visible[0]];
    rightAds = [visible[0]];
  }

  const renderAdCard = (ad: Ad) => (
    <div key={ad.id} className="relative group rounded-2xl overflow-hidden shadow-sm border border-slate-200/80 bg-white p-0.5">
      {ad.linkUrl ? (
        <a href={ad.linkUrl} target="_blank" rel="noopener noreferrer" title={ad.title} className="block w-full h-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={ad.imageUrl}
            alt={ad.title}
            className="w-full aspect-[9/16] object-cover hover:scale-105 transition-transform duration-300 rounded-xl"
          />
        </a>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={ad.imageUrl}
          alt={ad.title}
          className="w-full aspect-[9/16] object-cover rounded-xl"
        />
      )}
      {/* Tooltip title */}
      <div className="absolute bottom-1.5 left-1.5 right-1.5 bg-black/70 px-2 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition duration-200">
        <p className="text-white text-[9px] font-medium leading-tight line-clamp-2 text-center">{ad.title}</p>
      </div>
      {/* Nút đóng */}
      <button
        onClick={() => setDismissed((prev) => new Set([...prev, ad.id]))}
        className="absolute top-2 right-2 p-1 rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 transition hover:bg-black/60"
        title="Ẩn quảng cáo"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );

  return (
    <>
      {/* Popup dọc bên TRÁI */}
      {leftAds.length > 0 && (
        <aside
          className="hidden xl:flex flex-col gap-2 fixed top-24 w-28 2xl:w-36 z-40 animate-fade-in"
          style={{ left: "max(12px, calc(50% - 640px - 144px - 16px))" }}
        >
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center select-none">
            Tuyên truyền
          </p>
          <div className="flex flex-col gap-2">
            {leftAds.map(renderAdCard)}
          </div>
        </aside>
      )}

      {/* Popup dọc bên PHẢI */}
      {rightAds.length > 0 && (
        <aside
          className="hidden xl:flex flex-col gap-2 fixed top-24 w-28 2xl:w-36 z-40 animate-fade-in"
          style={{ right: "max(12px, calc(50% - 640px - 144px - 16px))" }}
        >
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center select-none">
            Tuyên truyền
          </p>
          <div className="flex flex-col gap-2">
            {rightAds.map(renderAdCard)}
          </div>
        </aside>
      )}
    </>
  );
}