"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Loader } from 'lucide-react';
import Survey from '@/components/Survey'; // Импортируем компонент Survey
import Image from 'next/image';
import banner from '@/app/banner.svg'; // Оставляем старое изображение баннера

export default function Dashboard() {
  const { user, loading } = useAuth(); // Получаем информацию о пользователе и состояние загрузки
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const surveyId = 1; // Здесь можно указать конкретный ID опроса, который нужно отображать

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Если пользователь не авторизован или ему нужно пройти верификацию OTP, перенаправляем на главную страницу
    if (!loading && mounted && (!user || (user.otp_validate && !user.otp_verified))) {
      router.push('/');
    }
  }, [user, loading, mounted, router]);

  if (loading || !mounted) {
    // Показываем индикатор загрузки, пока проверяем авторизацию
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="animate-spin w-6 h-6 text-black dark:text-white" />
      </div>
    );
  }

  // Функция для прокрутки к форме опроса
  const handleStartTest = () => {
    const surveySection = document.getElementById('survey-section');
    if (surveySection) {
      surveySection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Новый минималистичный дизайн страницы
  return (
    <div className="w-full p-0" style={{ paddingTop: '1rem' }}> {/* Добавляем отступ сверху для учета высоты NavBar */}
      {/* Баннер с картинкой и текстом */}
      <div className="relative w-full mb-10 overflow-hidden h-[300px] md:h-[400px] lg:h-[450px] flex flex-col items-center justify-center">
        <Image
          src={banner} // Используем старое изображение
          alt="Survey Banner"
          layout="fill" // Используем fill для заполнения контейнера
          className="object-cover"
          priority // Оптимизирует изображение для LCP
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-black/50 to-transparent">
          <h1 className="text-white text-4xl md:text-5xl font-semibold mb-4 text-center">
            Проверьте свое здоровье прямо сейчас!
          </h1>
          <p className="text-white text-md md:text-lg mb-6 text-center">
            Этот тест поможет вам определить вероятность наличия диабета, пройдите его, чтобы узнать больше.
          </p>
          <button
  onClick={handleStartTest}
  className="bg-gradient-to-r from-green-400 to-green-600 text-white hover:from-green-500 hover:to-green-700 transition px-6 py-3 rounded-full font-bold shadow-lg"
>
  Начать тест
</button>

        </div>
      </div>

      {/* Основной контейнер с опросом */}
      <div
            id="survey-section"
            className="container mx-auto px-4 py-8 bg-white dark:bg-gray-900 rounded-lg shadow-md max-w-4xl border border-black dark:border-white"
        >

        <Survey surveyId={surveyId} />
      </div>
    </div>
  );
}
