// src/components/BannerStrip.tsx
// Banner ngang — hiện dưới Navbar hoặc giữa trang
// Hỗ trợ nhiều banner theo vị trí: TOP | MIDDLE | BOTTOM
"use client";
import { useEffect, useState, useRef } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

type Banner = {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl: string | null;
  position: string;
};

interface Props {
  position: "TOP" | "MIDDLE" | "BOTTOM";
  className?: string;
}

export default function BannerStrip({ position, className = "" }: Props) {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [current, setCurrent] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetch("/api/banners")
      .then((r) => r.json())
      .then((all: Banner[]) => {
        const filtered = all.filter((b) => b.position === position);
        setBanners(filtered);
      })
      .catch(() => {});
  }, [position]);

  // Auto-slide mỗi 5 giây nếu có nhiều banner
  useEffect(() => {
    if (banners.length <= 1) return;
    timerRef.current = setInterval(() => {
      setCurrent((c) => (c + 1) % banners.length);
    }, 5000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [banners.length]);

  if (!banners.length || dismissed) return null;

  const banner = banners[current];

  const inner = (
    <div className="relative w-full overflow-hidden group rounded-2xl border border-slate-100 shadow-sm bg-slate-50">
      {/* Ảnh banner tự động dàn ngang toàn bộ, tỷ lệ gốc sẽ làm chiều cao tự động */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={banner.imageUrl}
        alt={banner.title}
        className="w-full h-auto object-cover bg-white transition-opacity duration-500"
        style={{ display: "block" }}
      />

      {/* Nút prev/next nếu nhiều banner */}
      {banners.length > 1 && (
        <>
          <button
            onClick={(e) => { e.preventDefault(); setCurrent((c) => (c - 1 + banners.length) % banners.length); }}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/30 text-white opacity-0 group-hover:opacity-100 transition hover:bg-black/50"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.preventDefault(); setCurrent((c) => (c + 1) % banners.length); }}
            className="absolute right-8 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/30 text-white opacity-0 group-hover:opacity-100 transition hover:bg-black/50"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          {/* Dots */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.preventDefault(); setCurrent(i); }}
                className={`w-1.5 h-1.5 rounded-full transition-all ${i === current ? "bg-white scale-125" : "bg-white/50"}`}
              />
            ))}
          </div>
        </>
      )}

      {/* Nút đóng */}
      <button
        onClick={(e) => { e.stopPropagation(); setDismissed(true); }}
        className="absolute top-2 right-2 p-1 rounded-full bg-black/30 text-white hover:bg-black/50 transition"
        title="Đóng banner"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );

  return (
    <div className={`w-full ${className}`}>
      {banner.linkUrl ? (
        <a href={banner.linkUrl} target="_blank" rel="noopener noreferrer" className="block">
          {inner}
        </a>
      ) : inner}
    </div>
  );
}
