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
    <div className="relative w-full overflow-hidden group rounded-b-2xl border-b border-x border-slate-200 shadow-sm bg-slate-50">
      <div 
        className="flex transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]" 
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {banners.map((b) => (
          <div key={b.id} className="w-full shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={b.imageUrl}
              alt={b.title}
              className="w-full h-auto bg-white"
              style={{ display: "block" }}
            />
          </div>
        ))}
      </div>

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
