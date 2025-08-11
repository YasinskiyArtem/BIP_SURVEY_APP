// src/app/layout.tsx
"use client";

import "./globals.css";
import { Inter } from 'next/font/google';
import { cn } from "@/lib/utils";
import Navbar from '@/components/Navbar';
import { ThemeProvider } from 'next-themes';
import { AuthProvider } from '@/context/AuthContext'; // Импорт AuthProvider

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={cn(inter.className, 'antialiased min-h-screen pt-10')}>
        {/* Оборачиваем все дочерние компоненты в AuthProvider */}
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            <Navbar />
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
