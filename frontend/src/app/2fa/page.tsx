"use client";

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// Динамически импортируем QRCodeCanvas без SSR (Server-Side Rendering)
const QRCodeCanvas = dynamic(() => import('qrcode.react').then((mod) => mod.QRCodeCanvas), { ssr: false });

export default function TwoFactorAuth() {
  const [otpAuthUrl, setOtpAuthUrl] = useState(''); // Состояние для хранения URL с QR-кодом
  const [otp, setOtp] = useState(''); // Состояние для введенного пользователем OTP
  const [message, setMessage] = useState(''); // Состояние для отображения сообщений об успехе или ошибке
  const router = useRouter();
  const searchParams = useSearchParams(); // Извлекаем параметры запроса (userId)
  const userId = searchParams.get('userId'); // Извлекаем userId из параметров запроса

  // Функция для получения QR-кода (отправка запроса на бэкенд)
  useEffect(() => {
    if (userId) {
      fetchOtpAuthUrl(userId);
    }
  }, [userId]);

  // Функция для запроса QR-кода с сервера
  const fetchOtpAuthUrl = async (userId: string) => {
    try {
      const response = await fetch('http://localhost:8000/api/auth/otp/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: userId, email: 'user@example.com' }) // Замените на реальный email
      });

      const data = await response.json();
      if (response.ok) {
        setOtpAuthUrl(data.otpauth_url);
        setMessage('Scan the QR code with Google Authenticator.');
      } else {
        setMessage(data.message || 'Failed to load OTP.');
      }
    } catch (error) {
        console.error('OTP generation error:', error);
        setMessage(error instanceof Error ? error.message : 'An error occurred while fetching OTP');
      // setMessage('An error occurred while fetching OTP.');
    }
  };

  // Функция для отправки введенного пользователем OTP на сервер для верификации
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:8000/api/auth/otp/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: userId, token: otp })
      });

      const data = await response.json();
      if (response.ok) {
        setMessage('OTP verified successfully');
        router.push('/dashboard'); // Перенаправляем пользователя на защищенную страницу после успешной верификации
      } else {
        setMessage(data.message || 'OTP verification failed');
      }
    } catch (error) {
        console.error('OTP generation error:', error);
        setMessage(error instanceof Error ? error.message : 'An unexpected error occurred');
      // setMessage('An error occurred during OTP verification.');
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl mb-4">Enable Two-Factor Authentication</h2>

      {otpAuthUrl && (
        <div className="mb-4">
          <QRCodeCanvas value={otpAuthUrl} /> {/* QR-код для сканирования в Google Authenticator */}
          <p className="text-gray-600">Scan this QR code with Google Authenticator.</p>
        </div>
      )}

      {/* Форма для ввода OTP под QR-кодом */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Enter OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)} // Обновляем значение OTP при вводе пользователем
          className="border p-2 w-full"
        />
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
          Verify OTP
        </button>
      </form>

      {/* Сообщение об успехе или ошибке */}
      {message && <p className="mt-4 text-red-500">{message}</p>}
    </div>
  );
}
