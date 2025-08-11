'use client';
import React, { useEffect, useState } from 'react';
import SignInButton from "@/components/SigninButton";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useTheme } from 'next-themes';

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Установка флага mounted в true после монтирования компонента
  useEffect(() => {
    setMounted(true);
  }, []);

  // Перенаправление на /dashboard в зависимости от флагов пользователя
  useEffect(() => {
    if (user && pathname === '/') {
      if (!user.otp_validate || (user.otp_validate && user.otp_verified)) {
        router.push('/dashboard');
      }
    }
  }, [user, router, pathname]);

  // Возвращаем null, если компонент еще не смонтирован, чтобы избежать ошибки гидратации
  if (!mounted) {
    return null;
  }

  return (
    <div className="flex absolute -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2 from-gray-900 to-gray-800">
      <div className="w-[400px] rounded-xl shadow-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
        <CardHeader className="p-6">
          <CardTitle className="text-2xl font-bold mb-2 text-gray-800 dark:text-white">
            {theme === 'dark' || theme === 'system' ? 'Welcome to HealthForm 🌙!' : 'Welcome to HealthForm 🏥!'}
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-300">
            HealthForm is a platform that helps you evaluate your health by answering a series of medical questions. Start by logging in below to see potential conditions based on your symptoms!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignInButton text="Login" />
        </CardContent>
      </div>
    </div>
  );
}
