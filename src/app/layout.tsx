// src/app/layout.tsx — root layout
import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BannerStrip from "@/components/BannerStrip";
import PopupAd from "@/components/PopupAd";
import { getSession } from "@/lib/auth";

const outfit = Outfit({
  subsets: ["latin", "latin-ext"], // Thêm "latin-ext" để sửa lỗi font tiếng Việt
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CDC Media – Ngân hàng Tài liệu Truyền thông CDC Đà Nẵng",
  description:
    "Hệ thống quản lý và chia sẻ tài liệu truyền thông sức khỏe của Trung tâm Kiểm soát Bệnh tật TP. Đà Nẵng",
  keywords: ["CDC Đà Nẵng", "truyền thông sức khỏe", "tài liệu y tế", "phòng chống dịch"],
  authors: [{ name: "CDC Đà Nẵng – Bộ phận IT" }],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  return (
    <html lang="vi" className={outfit.variable}>
      <body className="gradient-bg bg-grid min-h-screen flex flex-col">
        <Toaster
          position="top-right"
          toastOptions={{
            className: "!rounded-2xl !shadow-lg !font-medium",
            duration: 3000,
          }}
        />
            <Navbar session={session} />
        
        {/* Banner ngang TOP — dưới Navbar */}
        <div className="w-full">
          <BannerStrip position="TOP" className="w-full overflow-hidden" />
        </div>
        
        <main className="flex-1">{children}</main>
        
        {/* Banner ngang BOTTOM — trên Footer */}
        <div className="w-full">
          <BannerStrip position="BOTTOM" className="w-full overflow-hidden" />
        </div>
        
        <Footer />
        {/* Popup tuyên truyền */}
        <PopupAd />
      </body>
    </html>
  );
}
