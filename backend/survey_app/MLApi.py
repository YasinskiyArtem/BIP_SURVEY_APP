import pickle
import numpy as np
import pandas as pd
import joblib
import pickle
import pandas as pd

from django.db import transaction
from rest_framework import generics, status
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Survey, SurveyQuestion, SurveyAnswer
from django.contrib.auth import get_user_model
import pandas as pd
import pickle
import numpy as np
from datetime import datetime

User = get_user_model()


# тестовая функция
def test():
    # Шаг 1: Загрузка модели и скалера
    with open('svc_model.pkl', 'rb') as model_file:
        model = pickle.load(model_file)

    #with open('scaler.pkl', 'rb') as scaler_file:
    #    scaler = pickle.load(scaler_file)

    # Шаг 2: Новые данные (пример)
    new_data = {
        'age': 45,
        'gender': 'Male',
        'hypertension': 'Yes',
        'heart_disease': 'Yes',
        'smoking_history': 'never',  # 'never', 'No Info', 'current', 'former', 'ever', 'not current'
        'bmi': 25.5,              # число (например, 25.5)
        'HbA1c_level': 5.7,        # число (например, 5.7)
        'blood_glucose_level': 120 # число (например, 120)
    }

    # Шаг 3: Преобразование данных
    # Сначала создаем DataFrame для новых данных
    new_data_df = pd.DataFrame([new_data])

    # Кодируем категориальные признаки
    new_data_df['gender'] = new_data_df['gender'].map({'Female': 0, 'Male': 1, 'Other': 2}).fillna(2).astype(int)
    new_data_df['hypertension'] = new_data_df['hypertension'].map({'Yes': 1, 'No': 0}).astype(int)
    new_data_df['heart_disease'] = new_data_df['heart_disease'].map({'Yes': 1, 'No': 0}).astype(int)

    smoking_mapping = {
        'never': 0,
        'No Info': 1,
        'current': 2,
        'former': 3,
        'ever': 4,
        'not current': 5
    }
    new_data_df['smoking_history'] = new_data_df['smoking_history'].map(smoking_mapping).fillna(1).astype(int)

    # Шаг 4: Применение скалера (масштабирование данных)
    scaled_data = scaler.transform(new_data_df)

    # Шаг 5: Предсказание с помощью модели
    prediction = model.predict(scaled_data)
    # Шаг 6: Вывод результата
    if prediction[0] == 1:
        print("Модель предсказывает, что пациент болен диабетом (Positive).")
    else:
        print("Модель предсказывает, что пациент НЕ болен диабетом (Negative).")


def parse_survey_answer(survey_answer):
    """"
    Преобразует ответы из опроса в формат для модели.

    Пример входных данных (survey_answer):
    ['22', 'Мужской', 'Нет', 'Нет', 'Никогда', '25.5', '6', '120']

    Возвращает словарь с данными в нужном формате.
    """
    # Маппинг для курения (рус → англ → код)
    smoking_mapping_ru_en = {
        'Никогда': 'never',
        'Курит': 'current',
        'Бросил': 'former',
        'Иногда': 'ever',
        'Не курю': 'not_now',
        'Нет информации': 'unknown'
    }

    # Маппинг для hypertension и heart_disease (рус → англ)
    yes_no_mapping = {
        'Да': 'Yes',
        'Нет': 'No'
    }

    # Извлекаем данные из ответов
    age = float(survey_answer[0])  # '22' → 22.0
    gender = 'Male' if survey_answer[1].lower() == 'Мужской' else 'Female'
    hypertension = yes_no_mapping.get(survey_answer[2], 'No')
    heart_disease = yes_no_mapping.get(survey_answer[3], 'No')
    smoking_history_ru = survey_answer[4]
    smoking_history_en = smoking_mapping_ru_en.get(smoking_history_ru, 'unknown')
    bmi = float(survey_answer[5])  # '25.5' → 25.5
    hba1c = float(survey_answer[6])  # '6' → 6.0
    glucose = float(survey_answer[7])  # '120' → 120.0

    # Формируем итоговый словарь
    parsed_data = {
        'gender': gender,
        'age': age,
        'hypertension': hypertension,
        'heart_disease': heart_disease,
        'smoking_history': smoking_history_en,
        'bmi': bmi,
        'HbA1c_level': hba1c,
        'blood_glucose_level': glucose
    }

    return parsed_data

def get_model_answer(survey_answer):
    """
    Предсказывает наличие диабета на основе ответов из опроса.
    Возвращает:
        - True (диабет есть)
        - False (диабета нет)
    """
    # Шаг 1: Загрузка модели (вместе со скалером, т.к. он внутри Pipeline)
    pipeline = joblib.load('survey_app/svc_model.pkl')  # Укажите правильный путь

    # Шаг 2: Парсинг ответов в нужный формат
    parsed_data = parse_survey_answer(survey_answer)

    # Шаг 3: Создаем DataFrame
    new_data_df = pd.DataFrame([parsed_data])

    # Шаг 4: Кодируем категориальные признаки
    # gender: 'Male' → 1, 'Female' → 0, 'Other' → 2
    new_data_df['gender'] = new_data_df['gender'].map({'Male': 1, 'Female': 0, 'Other': 2}).fillna(2).astype(int)

    # hypertension и heart_disease: 'Yes' → 1, 'No' → 0
    new_data_df['hypertension'] = new_data_df['hypertension'].map({'Yes': 1, 'No': 0}).astype(int)
    new_data_df['heart_disease'] = new_data_df['heart_disease'].map({'Yes': 1, 'No': 0}).astype(int)

    # smoking_history: преобразуем в числа (как в модели)
    smoking_mapping = {
        'never': 0,
        'current': 1,
        'former': 2,
        'ever': 3,
        'not_now': 4,
        'unknown': 5
    }
    new_data_df['smoking_history'] = new_data_df['smoking_history'].map(smoking_mapping).fillna(1).astype(int)

    # Шаг 5: Предсказание (pipeline сам масштабирует данные!)
    prediction = pipeline.predict(new_data_df)

    # Шаг 6: Вывод результата
    if prediction[0] == 1:
        #print("Модель предсказывает, что пациент болен диабетом (Positive).")
        return True
    else:
        #print("Модель предсказывает, что пациент НЕ болен диабетом (Negative).")
        return False

#
#
