"use client";
import { useEffect, useState } from "react";
import { Users } from "lucide-react";

export default function VisitorCounter() {
  const [count, setCount] = useState<number | null>(null);
  
  useEffect(() => {
    fetch("/api/visitors", { method: "POST" })
      .then(r => r.json())
      .then(d => setCount(d.count))
      .catch(() => {});
  }, []);
  
  if (count === null) return null;
  return (
    <div className="flex items-center gap-2 bg-[#0d5485] px-3 py-1.5 rounded-lg border border-blue-400/30">
      <Users className="w-4 h-4 text-orange-400" />
      <span className="text-white text-xs font-semibold">
        Đang trực tuyến: <span className="text-orange-400">{Math.floor(Math.random() * 5) + 1}</span>
      </span>
      <span className="text-white/40 text-xs px-1">|</span>
      <span className="text-white text-xs font-semibold">
        Tổng truy cập: <span className="text-orange-400">{count.toLocaleString("vi-VN")}</span>
      </span>
    </div>
  );
}
