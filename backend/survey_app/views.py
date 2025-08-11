from django.shortcuts import render
from rest_framework import generics
import logging
import joblib
from otp_app.models import get_user_id
from otp_app.permission import IsAuthenticatedAndVerified
from .MLApi import get_model_answer
from .models import Survey
from .serializers import SurveySerializer
from rest_framework import generics
from rest_framework.response import Response
from rest_framework import status
from .models import SurveyAnswer
from .serializers import SurveyAnswerSerializer
from django.shortcuts import get_object_or_404
from rest_framework import generics
from rest_framework.response import Response
from rest_framework import status
from .models import SurveyAnswer, SurveyQuestion
from .serializers import SurveyAnswerSerializer

logger = logging.getLogger(__name__)

class SurveyDetailView(generics.RetrieveAPIView):
    queryset = Survey.objects.all()
    serializer_class = SurveySerializer


class SubmitSurveyView(generics.GenericAPIView):
    serializer_class = SurveyAnswerSerializer

    def parse_answer(self, question_id, answer_text):
        """
        Обрабатывает отдельный ответ на вопрос
        """
        answer_lower = str(answer_text).lower()

        # Возраст
        if question_id == 1:
            try:
                age = int(answer_text)
                return max(20, min(age, 100))
            except ValueError:
                return 20

        # Пол
        elif question_id == 2:
            if answer_lower in ('мужской', 'женский'):
                return answer_text.capitalize()
            return 'Мужской'  # значение по умолчанию

        # Гипертония
        elif question_id == 3:
            if answer_lower in ('да', 'нет'):
                return answer_text.capitalize()
            return 'Нет'  # значение по умолчанию

        # Болезни сердца
        elif question_id == 4:
            if answer_lower in ('да', 'нет'):
                return answer_text.capitalize()
            return 'Нет'  # значение по умолчанию

        # Курение
        elif question_id == 5:
            smoking_map = {
                'никогда': 'never',
                'курит': 'current',
                'бросил': 'former',
                'раньше курил': 'ever',
                'не курю': 'not_now',
                'нет информации': 'unknown'
            }
            return smoking_map.get(answer_lower, 'unknown')

        # BMI
        elif question_id == 6:
            try:
                return float(answer_text)
            except ValueError:
                return 22.0

        # HbA1c
        elif question_id == 7:
            try:
                return float(answer_text)
            except ValueError:
                return 5.0

        # Уровень глюкозы
        elif question_id == 8:
            try:
                return float(answer_text)
            except ValueError:
                return 100

        return answer_text  # для неизвестных вопросов возвращаем как есть

    def post(self, request, *args, **kwargs):
        logger.info(f"Request data: {request.data}")
        print("Raw request data:", request.data)

        user = request.user
        data = request.data
        answers = data.get('answers', [])

        if not isinstance(answers, list):
            return Response({
                "status": "error",
                "message": "Answers should be a list"
            }, status=status.HTTP_400_BAD_REQUEST)

        ml_answers = []

        try:
            for answer_data in answers:
                if not isinstance(answer_data, dict):
                    continue

                question_id = answer_data.get('question_id')
                answer_text = answer_data.get('answer_text', '')

                if not question_id:
                    continue

                # Парсим ответ для ML модели
                parsed_answer = self.parse_answer(question_id, answer_text)
                ml_answers.append(parsed_answer)

                # Сохраняем в БД
                try:
                    question = SurveyQuestion.objects.get(id=question_id)
                    SurveyAnswer.objects.update_or_create(
                        user=user,
                        question=question,
                        defaults={'answer_text': answer_text}  # сохраняем оригинальный ответ
                    )
                except SurveyQuestion.DoesNotExist:
                    logger.warning(f"Question with id {question_id} not found")
                    continue
                except Exception as e:
                    logger.error(f"Error saving answer: {str(e)}")
                    continue

            # Получаем предсказание модели
            has_diabetes = get_model_answer(ml_answers)
            return Response({
                "status": "success",
                "message": "Survey answers submitted successfully.",
                "prediction": has_diabetes
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Error processing survey: {str(e)}", exc_info=True)
            return Response({
                "status": "error",
                "message": "Internal server error"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

#        return Response({"status": "success", "message": "Survey answers submitted successfully."},
#                        status=status.HTTP_200_OK)

class SurveyResultsView(generics.GenericAPIView):
    def get(self, request, survey_id, *args, **kwargs):
        user = request.user
        survey = get_object_or_404(Survey, id=survey_id)
        questions = survey.questions.all()
        questions_data = []
        answer_for_ml = []

        for question in questions:
            user_answer = SurveyAnswer.objects.filter(user=user, question=question).first()
            answer_text = user_answer.answer_text if user_answer else None

            questions_data.append({
                'question': question.text,
                'answer': answer_text or "No answer"
            })

            if answer_text:  # Только если есть ответ
                answer_for_ml.append(answer_text)

        # Получаем предсказание модели
        try:
            survey_result = get_model_answer(answer_for_ml)
            result_text = ("Модель предсказывает, что пациент болен диабетом (Positive)."
                           if survey_result else
                           "Модель предсказывает, что пациент НЕ болен диабетом (Negative).")
        except Exception as e:
            result_text = f"Ошибка предсказания: {str(e)}"

        return Response({
            'survey': survey.name,
            'description': survey.description,
            'questions': questions_data,
            'result': result_text
        })

"""
class SurveyResultsView(generics.GenericAPIView):
    def get(self, request, survey_id, *args, **kwargs):
        user = request.user
        survey = get_object_or_404(Survey, id=survey_id)

        # Получаем все вопросы опроса
        questions = survey.questions.all()
        questions_data = []

        answer_for_ml = []

        # Для каждого вопроса находим ответ пользователя
        for question in questions:
            user_answer = SurveyAnswer.objects.filter(user=user, question=question).first()
            question_data = {
                'question': question.text,
                'answer': user_answer.answer_text if user_answer else "No answer"
            }
            answer_for_ml.append(user_answer.answer_text if user_answer else "No answer")
            questions_data.append(question_data)
        #print(answer_for_ml)
        survey_result = get_model_answer(answer_for_ml)
        if survey_result:
            result_text = "Модель предсказывает, что пациент болен диабетом (Positive)."
        else:
            result_text = "Модель предсказывает, что пациент НЕ болен диабетом (Negative)."
        return Response({
            'survey': survey.name,
            'description': survey.description,
            'questions': questions_data,
            'result': result_text
        })
"""

"""
def parse_answer(question_id, answer):
    print(question_id, answer)
    if question_id == 1:
        if int(answer) < 20:
            return 20
        elif int(answer) > 65:
            return 65
        else:
            return int(answer)
    elif question_id == 2:
        if answer.lower() in ('мужской', 'женский'):
            return answer.lower()
        else:
            #print('proba')
            return 'мужской'
    else:
        if answer.lower() in ('да', 'нет'):
            return answer.lower()


class SubmitSurveyView(generics.GenericAPIView):
    serializer_class = SurveyAnswerSerializer

    def post(self, request, *args, **kwargs):
        user = request.user  # Текущий пользователь
        data = request.data

        # Получаем ответы из запроса
        answers = data.get('answers', [])

        # Проходим по каждому вопросу
        for answer_data in answers:
            question_id = answer_data['question_id']
            answer_text = parse_answer(question_id, answer_data['answer_text'])

            # Ищем вопрос
            question = SurveyQuestion.objects.get(id=question_id)

            # Проверяем, существует ли уже ответ на этот вопрос для данного пользователя
            existing_answer = SurveyAnswer.objects.filter(user=user, question=question).first()

            if existing_answer:
                # Если ответ существует, обновляем его
                existing_answer.answer_text = answer_text
                existing_answer.save()
            else:
                # Если ответа нет, создаём новый
                SurveyAnswer.objects.create(
                    user=user,
                    question=question,
                    answer_text=answer_text
                )

        return Response({"status": "success", "message": "Survey answers submitted successfully."},
                        status=status.HTTP_200_OK)


class SurveyResultsView(generics.GenericAPIView):
    def get(self, request, survey_id, *args, **kwargs):
        user = request.user
        survey = get_object_or_404(Survey, id=survey_id)

        # Получаем все вопросы опроса
        questions = survey.questions.all()
        questions_data = []

        answer_for_ml = []

        # Для каждого вопроса находим ответ пользователя
        for question in questions:
            user_answer = SurveyAnswer.objects.filter(user=user, question=question).first()
            question_data = {
                'question': question.text,
                'answer': user_answer.answer_text if user_answer else "No answer"
            }
            answer_for_ml.append(user_answer.answer_text if user_answer else "No answer")
            questions_data.append(question_data)
        #print(answer_for_ml)
        survey_result = get_model_answer(answer_for_ml)
        if survey_result:
            result_text = "Модель предсказывает, что пациент болен диабетом (Positive)."
        else:
            result_text = "Модель предсказывает, что пациент НЕ болен диабетом (Negative)."
        return Response({
            'survey': survey.name,
            'description': survey.description,
            'questions': questions_data,
            'result': result_text
        })
"""