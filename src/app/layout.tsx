import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { SessionProvider } from "@/components/providers/session-provider";
import { auth } from "@/lib/auth";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PianoRecord - 钢琴老师课程记录",
  description: "钢琴老师课程记录与管理平台",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col pb-14 md:pb-0">
        <SessionProvider>
          {session?.user ? (
            <div className="flex h-screen">
              <Sidebar />
              <main className="flex-1 overflow-auto p-3 md:p-6">{children}</main>
            </div>
          ) : (
            <main className="min-h-screen">{children}</main>
          )}
          {session?.user && <BottomNav />}
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  );
}
