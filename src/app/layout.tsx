import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { Header } from "@/components/ui/header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: '구글 광고 리포트 | 광고 성과 분석',
  description: '구글 광고 API를 활용한 광고 성과 분석 및 리포트 도구',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Header>
          <div className="flex items-center space-x-4">
            <Link href="/" className="text-white">리포트</Link>
            <Link href="/keyword-chatbot" className="text-white">키워드관리 챗봇</Link>
          </div>
        </Header>
        {children}
      </body>
    </html>
  );
}
