'use client';

import Link from 'next/link';
import React from 'react';
import SignInButton from './SigninButton';
import RegisterButton from './RegisterButton'; // Компонент для кнопки регистрации
import UserAccountNav from './UserAccountNav';
import { useAuth } from '@/context/AuthContext';
import { ThemeToggle } from './ThemeToggle';
import { Loader } from 'lucide-react';

const Navbar = () => {
  const { user, loading } = useAuth(); // Получаем пользователя и состояние загрузки из контекста

  return (
    <div className="fixed inset-x-0 top-0 bg-white dark:bg-gray-950 z-[10] h-fit border-b border-zinc-300 py-2 overflow-hidden">
      <div className="flex items-center justify-between h-full gap-2 px-6 max-w-full">
        {/* Логотип */}
        <Link href="/" className="flex items-center gap-2">
          <p className="flex rounded-lg border-2 border-b-4 border-r-4 border-black px-2 py-1 text-xl font-bold transition-all hover:-translate-y-[2px] md:block dark:border-white">
            HealthForm
          </p>
        </Link>
        <div className="ml-auto flex items-center">
          <ThemeToggle className="mr-3" />
          {user && user.otp_verified ? (
  <UserAccountNav user={user} />
) : loading ? (
  <div className="flex items-center justify-center">
    <Loader className="animate-spin w-6 h-6 text-black dark:text-white" />
  </div>
) : (
  <div className="flex items-center gap-2">
    <RegisterButton text="Sign in" className="text-black dark:text-white hover:underline" />
    <span className="text-black dark:text-white mx-1">or</span>
    <SignInButton text="Login" />
  </div>
)}

        </div>
      </div>
    </div>
  );
};

export default Navbar;
