'use client';

import React, { createContext, useContext, useState, useEffect } from "react";

export interface User {
  image: string;
  firstName: string;
  lastName: string;
  email: string;
  token: string;
  otp_validate: boolean;  // Хранение информации о необходимости настройки OTP
  otp_verified: boolean;  // Хранение информации о пройденной верификации OTP
}

interface AuthContextType {
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
  setOtpVerified: (verified: boolean) => void; // Функция для установки флага otp_verified
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Загрузка информации о пользователе из localStorage при монтировании компонента
    const token = localStorage.getItem("authToken");
    if (token) {
      const userData = JSON.parse(localStorage.getItem("userData") || "{}");
      if (userData.token) {
        setUser(userData);
      }
    }
    setLoading(false);
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem("authToken", userData.token);
    localStorage.setItem("userData", JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("authToken");
    localStorage.removeItem("userData");
  };

  // Function to set otp_verified to true after successful OTP verification
  const setOtpVerified = (verified: boolean) => {
    if (user) {
      const updatedUser = { ...user, otp_verified: verified };
      setUser(updatedUser);
      localStorage.setItem("userData", JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, setOtpVerified, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext) as AuthContextType;
};
