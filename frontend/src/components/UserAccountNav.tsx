'use client';

import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import UserAvatar from './UserAvatar';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import type { User } from '@/context/AuthContext'; // Импорт интерфейса User

interface UserAccountNavProps {
  user: User;
}

const UserAccountNav: React.FC<UserAccountNavProps> = ({ user }) => {
  const { logout } = useAuth(); // Используем деструктуризацию, чтобы получить logout

  if (!user) return null; // Если user не передан, возвращаем null

  // Изменяем тип параметра на MouseEvent<HTMLDivElement, MouseEvent>
  const handleLogout = async (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault(); // Предотвращаем стандартное действие
    try {
      const response = await fetch("http://localhost:8000/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${localStorage.getItem("authToken")}`,
        },
        credentials: "include",
      });
  
      if (response.ok) {
        logout(); // Выход из системы
      } else {
        console.error("Logout failed", await response.json());
      }
    } catch (error) {
      console.error("An error occurred during logout:", error);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <UserAvatar
          className="w-10 h-10"
          user={{
            name: `${user.firstName} ${user.lastName}` || null,
            image: user.image || 'https://www.gravatar.com/avatar/?d=mp',
          }}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-white dark:bg-zinc-800" align="end">
  <div className="flex items-center justify-start gap-2 p-2">
    <div className="flex flex-col space-y-1 leading-none">
      {user.firstName || user.lastName ? (
        <p className="font-medium">{`${user.firstName || ''} ${user.lastName || ''}`.trim()}</p>
      ) : null}
      {user.email && (
        <p className="w-[200px] truncate text-sm text-zinc-700 dark:text-zinc-300">
          {user.email}
        </p>
      )}
    </div>
  </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="text-black dark:text-white">
          <a href="/profile">Profile</a>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleLogout} // Изменен тип на совместимый
          className="text-red-600 cursor-pointer"
        >
          Log out
          <LogOut className="w-4 h-4 ml-2 " />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserAccountNav;
