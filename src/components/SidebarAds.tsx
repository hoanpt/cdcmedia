// src/components/SidebarAds.tsx
// Sidebar dọc chạy trượt 2 bên màn hình (Căn lề sát nội dung chính)
"use client";
import { useEffect, useState } from "react";

type Ad = {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl: string | null;
};

export default function SidebarAds() {
  const [ads, setAds] = useState<Ad[]>([]);

  useEffect(() => {
    fetch("/api/sidebar-ads")
      .then((r) => r.json())
      .then(setAds)
      .catch(() => {});
  }, []);

  if (!ads.length) return null;

  // Phân loại quảng cáo trái phải theo vị trí (mặc định nếu null thì xem như LEFT)
  const leftAds = ads.filter(a => a.position === "LEFT");
  const rightAds = ads.filter(a => a.position === "RIGHT");

  const renderAdCard = (ad: Ad) => (
    <div key={ad.id} className="relative group rounded-2xl overflow-hidden shadow-md border border-slate-200/80 bg-white p-1">
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
    </div>
  );

  return (
    <>
      {/* Popup dọc bên TRÁI */}
      {leftAds.length > 0 && (
        <aside
          className="hidden xl:flex flex-col gap-3 fixed top-24 w-36 2xl:w-48 z-40 animate-fade-in"
          style={{ left: "max(12px, calc(50% - 640px - 192px - 24px))" }}
        >
          <div className="flex flex-col gap-3">
            {leftAds.map(renderAdCard)}
          </div>
        </aside>
      )}

      {/* Popup dọc bên PHẢI */}
      {rightAds.length > 0 && (
        <aside
          className="hidden xl:flex flex-col gap-3 fixed top-24 w-36 2xl:w-48 z-40 animate-fade-in"
          style={{ right: "max(12px, calc(50% - 640px - 192px - 24px))" }}
        >
          <div className="flex flex-col gap-3">
            {rightAds.map(renderAdCard)}
          </div>
        </aside>
      )}
    </>
  );
}