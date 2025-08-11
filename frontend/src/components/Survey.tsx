import React, { useEffect, useState } from 'react';
import { Loader } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useTheme } from 'next-themes';
import { ArrowRightCircle, CheckCircle, ArrowLeftCircle } from 'lucide-react';

// Типы для компонента Survey
interface SurveyQuestion {
  id: number;
  text: string;
}

interface SurveyType {
  id: number;
  name: string;
  description: string;
  questions: SurveyQuestion[];
}

interface SurveyProps {
  surveyId: number;
}

interface SurveyResult {
  question: string;
  answer: string;
}

const Survey: React.FC<SurveyProps> = ({ surveyId }) => {
  const { theme } = useTheme();
  const [survey, setSurvey] = useState<SurveyType | null>(null);
  const [responses, setResponses] = useState<{ [key: number]: string }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SurveyResult[] | null>(null);
  const [finalResult, setFinalResult] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Получение конкретного опроса по его ID
  useEffect(() => {
    const fetchSurvey = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/survey/${surveyId}/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Token ${localStorage.getItem('authToken')}`,
          },
        });
        if (!response.ok) {
          throw new Error('Failed to fetch survey');
        }
        const data: SurveyType = await response.json();
        setSurvey(data);
      } catch (error) {
        console.error('Error:', error);
        setError('Error fetching survey.');
      } finally {
        setLoading(false);
      }
    };

    fetchSurvey();
  }, [surveyId]);

  // Переключение на следующий вопрос
  const nextQuestion = () => {
    if (currentStep < (survey?.questions.length ?? 0) - 1) {
      setCurrentStep((prevStep) => prevStep + 1);
    }
  };

  // Переключение на предыдущий вопрос
  const prevQuestion = () => {
    if (currentStep > 0) {
      setCurrentStep((prevStep) => prevStep - 1);
    }
  };

  // Отправка данных опроса
  const handleSubmitSurvey = async () => {
    try {
      if (!survey) return;

      const incompleteAnswers = Object.entries(responses).some(
        ([, answerText]) => answerText === null || answerText === '' || answerText === undefined
      );

      if (incompleteAnswers) {
        alert('Пожалуйста, ответьте на все вопросы перед отправкой.');
        return;
      }

      setIsSubmitting(true);

      const response = await fetch('http://localhost:8000/api/survey/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({
          answers: Object.entries(responses)
            .filter(([, answerText]) => answerText)
            .map(([questionId, answerText]) => ({
              question_id: parseInt(questionId),
              answer_text: answerText,
            })),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit survey');
      }

      fetchSurveyResults();
    } catch (error) {
      console.error('Error submitting survey:', error);
      setError('Error submitting survey.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Получение результатов опроса
  const fetchSurveyResults = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8000/api/survey/result/${surveyId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${localStorage.getItem('authToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch survey results');
      }

      const data = await response.json();
      if (data && data.questions) {
        setResults(data.questions);
        setFinalResult(data.result);
      } else {
        throw new Error('No questions found in survey result');
      }
    } catch (error) {
      console.error('Error fetching survey results:', error);
      setError('Error fetching survey results.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="animate-spin w-6 h-6 text-black dark:text-white" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-500 text-xl">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white dark:bg-gray-900 rounded-lg shadow-lg max-w-2xl mx-auto">
      {survey ? (
        <div>
          <h3 className={`text-3xl font-bold mb-6 text-center ${theme === 'dark' ? 'text-red-400' : 'text-green-600'}`}>
            {survey.name}
          </h3>
          <p className="mb-4 text-lg text-center text-gray-600 dark:text-gray-300">{survey.description}</p>

          <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mb-6">
            <div
              className="bg-blue-600 dark:bg-red-600 h-2.5 rounded-full"
              style={{ width: `${((currentStep + 1) / survey.questions.length) * 100}%` }}
            ></div>
          </div>

                  <div className="mb-6 p-6 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-lg shadow-md">
                      <p className="text-lg font-medium mb-4">{survey.questions[currentStep].text}</p>

                      {survey.questions[currentStep].text.toLowerCase().includes('возраст') ? (
                          <input
                              type="number"
                              placeholder="Введите ваш возраст (числовое значение)"
                              value={responses[survey.questions[currentStep].id] || ''}
                              onChange={(e) =>
                                  setResponses((prev) => ({
                                      ...prev,
                                      [survey.questions[currentStep].id]: e.target.value,
                                  }))
                              }
                              className="w-full p-4 border border-gray-300 dark:border-gray-700 rounded-lg placeholder-gray-400 focus:outline-none focus:border-blue-500 dark:focus:border-red-500 text-lg"
                          />
                      ) : survey.questions[currentStep].text.toLowerCase().includes('пол') ? (
                          <RadioGroup
                              className="space-y-4"
                              value={responses[survey.questions[currentStep].id] || ''}
                              onValueChange={(value) =>
                                  setResponses((prev) => ({
                                      ...prev,
                                      [survey.questions[currentStep].id]: value,
                                  }))
                              }
                          >
                              <div className="flex items-center space-x-4">
                                  <RadioGroupItem value="мужской" id={`gender-male-${survey.questions[currentStep].id}`} />
                                  <label htmlFor={`gender-male-${survey.questions[currentStep].id}`} className="text-lg">Мужской</label>
                              </div>
                              <div className="flex items-center space-x-4">
                                  <RadioGroupItem value="женский" id={`gender-female-${survey.questions[currentStep].id}`} />
                                  <label htmlFor={`gender-female-${survey.questions[currentStep].id}`} className="text-lg">Женский</label>
                              </div>
                          </RadioGroup>
                      ) : survey.questions[currentStep].text.toLowerCase().includes('кур') ? (
                          <RadioGroup
                              className="space-y-4"
                              value={responses[survey.questions[currentStep].id] || ''}
                              onValueChange={(value) =>
                                  setResponses((prev) => ({
                                      ...prev,
                                      [survey.questions[currentStep].id]: value,
                                  }))
                              }
                          >
                              <div className="flex items-center space-x-4">
                                  <RadioGroupItem value="никогда" id={`smoking-never-${survey.questions[currentStep].id}`} />
                                  <label htmlFor={`never-${survey.questions[currentStep].id}`} className="text-lg">Никогда</label>
                              </div>
                              <div className="flex items-center space-x-4">
                                  <RadioGroupItem value="курит" id={`smoking-current-${survey.questions[currentStep].id}`} />
                                  <label htmlFor={`current-${survey.questions[currentStep].id}`} className="text-lg">Курит</label>
                              </div>
                              <div className="flex items-center space-x-4">
                                  <RadioGroupItem value="бросил" id={`smoking-former-${survey.questions[currentStep].id}`} />
                                  <label htmlFor={`former-${survey.questions[currentStep].id}`} className="text-lg">Бросил</label>
                              </div>
                              <div className="flex items-center space-x-4">
                                  <RadioGroupItem value="раньше курил" id={`smoking-past-${survey.questions[currentStep].id}`} />
                                  <label htmlFor={`ever-${survey.questions[currentStep].id}`} className="text-lg">Иногда</label>
                              </div>
                              <div className="flex items-center space-x-4">
                                  <RadioGroupItem value="не курю" id={`smoking-notnow-${survey.questions[currentStep].id}`} />
                                          <label htmlFor={`not_now-${survey.questions[currentStep].id}`} className="text-lg">Не курю</label>
                              </div>
                              <div className="flex items-center space-x-4">
                                  <RadioGroupItem value="нет информации" id={`smoking-unknown-${survey.questions[currentStep].id}`} />
                                          <label htmlFor={`unknown-${survey.questions[currentStep].id}`} className="text-lg">Нет информации</label>
                              </div>
                                  </RadioGroup>
                              ) : survey.questions[currentStep].text.toLowerCase().includes('bmi') ||
                                  survey.questions[currentStep].text.toLowerCase().includes('индекс массы тела') ? (
                                  <input
                                      type="number"
                                      step="0.1"
                                      placeholder="Введите ваш ИМТ (например: 22.5)"
                                      value={responses[survey.questions[currentStep].id] || ''}
                                      onChange={(e) =>
                                          setResponses((prev) => ({
                                              ...prev,
                                              [survey.questions[currentStep].id]: e.target.value,
                                          }))
                                      }
                                      className="w-full p-4 border border-gray-300 dark:border-gray-700 rounded-lg placeholder-gray-400 focus:outline-none focus:border-blue-500 dark:focus:border-red-500 text-lg"
                                  />
                              ) : survey.questions[currentStep].text.toLowerCase().includes('hba1c') ||
                                  survey.questions[currentStep].text.toLowerCase().includes('гликированный гемоглобин') ? (
                                  <input
                                      type="number"
                                      step="0.1"
                                      placeholder="Введите уровень HbA1c (например: 5.4)"
                                      value={responses[survey.questions[currentStep].id] || ''}
                                      onChange={(e) =>
                                          setResponses((prev) => ({
                                              ...prev,
                                              [survey.questions[currentStep].id]: e.target.value,
                                          }))
                                      }
                                      className="w-full p-4 border border-gray-300 dark:border-gray-700 rounded-lg placeholder-gray-400 focus:outline-none focus:border-blue-500 dark:focus:border-red-500 text-lg"
                                  />
                              ) : survey.questions[currentStep].text.toLowerCase().includes('глюкоз') ||
                                  survey.questions[currentStep].text.toLowerCase().includes('сахар') ? (
                                  <input
                                      type="number"
                                      placeholder="Введите уровень глюкозы (например: 100)"
                                      value={responses[survey.questions[currentStep].id] || ''}
                                      onChange={(e) =>
                                          setResponses((prev) => ({
                                              ...prev,
                                              [survey.questions[currentStep].id]: e.target.value,
                                          }))
                                      }
                                      className="w-full p-4 border border-gray-300 dark:border-gray-700 rounded-lg placeholder-gray-400 focus:outline-none focus:border-blue-500 dark:focus:border-red-500 text-lg"
                                  />
                              ) : (
                          <RadioGroup
                              className="space-y-4"
                              value={responses[survey.questions[currentStep].id] || ''}
                              onValueChange={(value) =>
                                  setResponses((prev) => ({
                                      ...prev,
                                      [survey.questions[currentStep].id]: value,
                                  }))
                              }
                          >
                              <div className="flex items-center space-x-4">
                                  <RadioGroupItem value="да" id={`yes-${survey.questions[currentStep].id}`} />
                                  <label htmlFor={`yes-${survey.questions[currentStep].id}`} className="text-lg">Да</label>
                              </div>
                              <div className="flex items-center space-x-4">
                                  <RadioGroupItem value="нет" id={`no-${survey.questions[currentStep].id}`} />
                                  <label htmlFor={`no-${survey.questions[currentStep].id}`} className="text-lg">Нет</label>
                              </div>
                          </RadioGroup>
            )}
          </div>

          <div className="flex justify-between items-center mt-6">
            <button
              onClick={prevQuestion}
              className={`flex items-center space-x-2 px-4 py-2 rounded-full hover:bg-opacity-80 transition disabled:opacity-50 ${
                theme === 'dark' ? 'bg-gray-400 text-white' : 'bg-black text-white'
              }`}
              disabled={currentStep === 0}
            >
              <ArrowLeftCircle className="w-5 h-5" />
              <span>Назад</span>
            </button>
            {currentStep < (survey.questions.length - 1) ? (
              <button
                onClick={nextQuestion}
                className={`flex items-center space-x-2 px-4 py-2 rounded-full hover:bg-opacity-80 transition ${
                  theme === 'dark' ? 'bg-red-500 text-white' : 'bg-black text-white'
                }`}
              >
                <span>Вперед</span>
                <ArrowRightCircle className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleSubmitSurvey}
                className={`flex items-center space-x-2 px-4 py-2 rounded-full hover:bg-opacity-80 transition ${
                  theme === 'dark' ? 'bg-red-500 text-white' : 'bg-black text-white'
                }`}
                disabled={isSubmitting}
              >
                <span>{isSubmitting ? 'Отправка...' : 'Отправить опрос'}</span>
                <CheckCircle className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      ) : (
        <p>Опрос недоступен.</p>
      )}

      {results && (
        <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4 text-center">Результаты Опроса</h3>
          {results.map((result, index) => (
            <div key={index} className="mb-4">
              <p className={`text-lg font-medium ${theme === 'dark' ? 'text-purple-300' : 'text-blue-700'}`}>{result.question}</p>
              <p className="text-gray-700 dark:text-gray-300">{result.answer}</p>
            </div>
          ))}
          {finalResult && (
            <div className="mt-6 p-4 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <h3 className="text-xl font-semibold text-center">Финальный результат</h3>
              <p className="text-center text-blue-700 dark:text-blue-300">{finalResult}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Survey;
