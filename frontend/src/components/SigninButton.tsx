'use client';

import React, { useState } from 'react';
import { Button } from './ui/button';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from './ui/input-otp'; // Импортируем компонент для ввода OTP

interface SignInButtonProps {
  text: string;
}

const SignInButton: React.FC<SignInButtonProps> = ({ text }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOtpDialogOpen, setIsOtpDialogOpen] = useState(false); // Открытие окна для OTP
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [otpToken, setOtpToken] = useState<string>(''); // Хранение OTP
  const [message, setMessage] = useState<string>('');
  const { login, setOtpVerified } = useAuth(); // Используем setOtpVerified
  const { theme } = useTheme();
  const router = useRouter();

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsOtpDialogOpen(false);
    setMessage('');
    setOtpToken('');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      //const response = await fetch('http://localhost:8000/api/auth/login', {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.status === 'pending_otp') {
          // Если требуется 2FA, открываем соответствующее окно для ввода OTP
          setIsOtpDialogOpen(true);
          setIsModalOpen(false);
          localStorage.setItem('authToken', data.token); // Сохраняем токен для последующего использования

          // Сохраняем информацию о пользователе с непроверенным OTP
          login({
            firstName: data.firstname,
            lastName: data.lastname,
            email: data.email,
            token: data.token,
            image: '',
            otp_validate: true,
            otp_verified: false,
          });
        } else if (data.status === 'success') {
          // Если 2FA не требуется, сразу перенаправляем
          login({
            firstName: data.firstname,
            lastName: data.lastname,
            email: data.email,
            token: data.token,
            image: '',
            otp_validate: false,
            otp_verified: true,
          });
          setMessage('Login successful');
          setTimeout(() => {
            handleCloseModal();
            router.push('/dashboard');
          }, 300);
        } else {
          setMessage(data.message || 'Login failed');
        }
      } else {
        setMessage(data.message || 'Login failed');
      }
    } catch (error) {
      console.error(error);
      setMessage('An error occurred.');
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('authToken');
    if (token && otpToken) {
      try {
        //const response = await fetch('http://localhost:8000/api/auth/otp/verify', {
        const response = await fetch('/api/auth/otp/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Token ${token}`,
          },
          body: JSON.stringify({ otp_token: otpToken }),
        });

        const data = await response.json();

        if (response.ok && data.status === 'success') {
          // Успешная верификация OTP
          setOtpVerified(true);
          setMessage('OTP validation successful');
          setIsOtpDialogOpen(false);
          setTimeout(() => {
            handleCloseModal();
            router.push('/dashboard'); // Перенаправляем после успешной верификации OTP
          }, 300);
        } else {
          setMessage('OTP validation failed');
        }
      } catch (error) {
        console.error('Error verifying OTP:', error);
        setMessage('An error occurred during OTP verification.');
      }
    }
  };

  const modalBackground = theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900';
  const inputBackground = theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900';
  const borderColor = theme === 'dark' ? 'border-gray-600' : 'border-gray-300';

  return (
    <>
      <Button onClick={handleOpenModal} variant="default" size="default">
        {text}
      </Button>

      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className={`p-8 rounded-lg shadow-lg max-w-md w-full ${modalBackground}`}>
            <h2 className="text-3xl mb-6 text-center font-bold">Log in to your account</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full p-3 rounded ${inputBackground} placeholder-gray-400 border ${borderColor} focus:outline-none focus:border-blue-500`}
              />
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full p-3 rounded ${inputBackground} placeholder-gray-400 border ${borderColor} focus:outline-none focus:border-blue-500`}
              />
              <div className="flex justify-between items-center space-x-4">
                <Button
                  type="button"
                  onClick={handleCloseModal}
                  variant="secondary"
                  size="default"
                  className="bg-red-600 text-white hover:bg-red-700"
                >
                  Close
                </Button>
                <Button type="submit" variant="default" size="default">
                  Login
                </Button>
              </div>
            </form>
            {message && <p className="mt-6 text-center text-red-400">{message}</p>}
          </div>
        </div>
      )}

      {isOtpDialogOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className={`p-11 rounded-lg shadow-lg max-w-md w-full ${modalBackground}`}>
            <h2 className="text-3xl mb-6 text-center font-bold">Enter Your OTP</h2>

            <form onSubmit={handleOtpSubmit} className="space-y-6">
              <InputOTP
              maxLength={6}
              value={otpToken}
              onChange={(value) => setOtpToken(value)}
              className="w-full"
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} className="bg-gray-100 dark:bg-gray-800 text-black dark:text-white border dark:border-gray-600" />
                <InputOTPSlot index={1} className="bg-gray-100 dark:bg-gray-800 text-black dark:text-white border dark:border-gray-600" />
                <InputOTPSlot index={2} className="bg-gray-100 dark:bg-gray-800 text-black dark:text-white border dark:border-gray-600" />
              </InputOTPGroup>
              <InputOTPSeparator className="text-black dark:text-white" />
              <InputOTPGroup>
                <InputOTPSlot index={3} className="bg-gray-100 dark:bg-gray-800 text-black dark:text-white border dark:border-gray-600" />
                <InputOTPSlot index={4} className="bg-gray-100 dark:bg-gray-800 text-black dark:text-white border dark:border-gray-600" />
                <InputOTPSlot index={5} className="bg-gray-100 dark:bg-gray-800 text-black dark:text-white border dark:border-gray-600" />
              </InputOTPGroup>
            </InputOTP>
              {message && <p className="mt-4 text-center text-red-500">{message}</p>}
              <div className="flex justify-between items-center space-x-4">
                <Button
                  type="button"
                  onClick={handleCloseModal}
                  variant="secondary"
                  size="default"
                  className="bg-red-600 text-white hover:bg-red-700"
                >
                  Close
                </Button>
                <Button type="submit" variant="default" size="default">
                  Verify OTP
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default SignInButton;