import type { Metadata, Viewport } from "next";
import "./../styles/globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "수능 OMR 성적 관리",
  description: "수능 대비 OMR 답안 제출 및 자동 채점, 성적 관리 앱",
  keywords: ["수능", "OMR", "성적관리", "모의고사", "국어", "수학", "영어"],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={cn("font-sans antialiased", geist.variable)}>
      <body className="bg-background text-foreground min-h-screen">{children}</body>
    </html>
  );
}
