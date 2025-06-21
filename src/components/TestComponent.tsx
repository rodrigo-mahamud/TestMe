import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { ChevronLeft, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { FailedQuestionsManager } from "../utils/failedQuestionsManager";

interface Question {
   question: string;
   options: string[];
   correct: number;
   explanation?: string;
}

interface TestComponentProps {
   testData: Question[];
   testName: string;
   category: string;
   onBack: () => void;
   isFailedQuestionsTest?: boolean;
}

export const TestComponent: React.FC<TestComponentProps> = ({ testData, testName, category, onBack, isFailedQuestionsTest = false }) => {
   const [currentQuestion, setCurrentQuestion] = useState(0);
   const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
   const [showResult, setShowResult] = useState(false);
   const [score, setScore] = useState(0);
   const [answers, setAnswers] = useState<(number | null)[]>([]);
   const [failedQuestions, setFailedQuestions] = useState<number[]>([]);

   useEffect(() => {
      setAnswers(new Array(testData.length).fill(null));
   }, [testData]);

   const handleAnswerSelect = (answerIndex: number) => {
      setSelectedAnswer(answerIndex);
      const newAnswers = [...answers];
      newAnswers[currentQuestion] = answerIndex;
      setAnswers(newAnswers);
   };

   const handleNext = () => {
      if (currentQuestion < testData.length - 1) {
         setCurrentQuestion(currentQuestion + 1);
         setSelectedAnswer(answers[currentQuestion + 1]);
      } else {
         // Calcular puntuación y trackear preguntas falladas
         let correctCount = 0;
         const newFailedQuestions: number[] = [];

         answers.forEach((answer, index) => {
            if (answer === testData[index].correct) {
               correctCount++;
            } else {
               newFailedQuestions.push(index);

               // Agregar a preguntas falladas solo si no es un test de preguntas falladas
               if (!isFailedQuestionsTest) {
                  FailedQuestionsManager.addFailedQuestion(category, testName, testData[index]);
               }
            }
         });

         setScore(correctCount);
         setFailedQuestions(newFailedQuestions);
         setShowResult(true);
      }
   };

   const handlePrevious = () => {
      if (currentQuestion > 0) {
         setCurrentQuestion(currentQuestion - 1);
         setSelectedAnswer(answers[currentQuestion - 1]);
      }
   };

   const resetTest = () => {
      setCurrentQuestion(0);
      setSelectedAnswer(null);
      setShowResult(false);
      setScore(0);
      setFailedQuestions([]);
      setAnswers(new Array(testData.length).fill(null));
   };

   const handleRemoveFromFailed = (questionIndex: number) => {
      if (isFailedQuestionsTest) {
         // Remover de preguntas falladas en localStorage
         const categoryFailed = FailedQuestionsManager.getFailedQuestionsByCategory(category);
         const globalIndex = categoryFailed.findIndex(
            (fq) =>
               fq.question === testData[questionIndex].question &&
               fq.correct === testData[questionIndex].correct &&
               JSON.stringify(fq.options) === JSON.stringify(testData[questionIndex].options)
         );

         if (globalIndex !== -1) {
            FailedQuestionsManager.removeFailedQuestion(category, globalIndex);
         }
      }
   };

   if (showResult) {
      const percentageScore = Math.round((score / testData.length) * 100);

      return (
         <div className='max-w-2xl mx-auto p-6'>
            <Card>
               <CardHeader className='text-center'>
                  <CardTitle className='text-2xl'>¡Test Completado!</CardTitle>
                  <CardDescription>
                     {testName}
                     {isFailedQuestionsTest && (
                        <div className='flex items-center justify-center gap-2 mt-2 text-orange-600'>
                           <AlertTriangle className='w-4 h-4' />
                           <span className='text-sm'>Test de Preguntas Falladas</span>
                        </div>
                     )}
                  </CardDescription>
               </CardHeader>
               <CardContent className='space-y-6'>
                  <div className='text-center'>
                     <div className='text-4xl font-bold text-primary mb-2'>
                        {score}/{testData.length}
                     </div>
                     <div className='text-lg text-muted-foreground'>{percentageScore}% de aciertos</div>
                     {failedQuestions.length > 0 && !isFailedQuestionsTest && (
                        <div className='mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg'>
                           <div className='flex items-center justify-center gap-2 text-orange-700'>
                              <AlertTriangle className='w-4 h-4' />
                              <span className='text-sm font-medium'>
                                 {failedQuestions.length} pregunta{failedQuestions.length !== 1 ? "s" : ""}
                                 {failedQuestions.length !== 1 ? " añadidas" : " añadida"} a repaso
                              </span>
                           </div>
                        </div>
                     )}
                  </div>

                  <div className='space-y-4'>
                     {testData.map((question, index) => {
                        const isCorrect = answers[index] === question.correct;
                        const wasAnswered = answers[index] !== null;

                        return (
                           <div key={index} className='border rounded-lg p-4'>
                              <div className='flex items-start gap-3'>
                                 {isCorrect ? (
                                    <CheckCircle className='w-5 h-5 text-green-500 mt-0.5 flex-shrink-0' />
                                 ) : (
                                    <XCircle className='w-5 h-5 text-red-500 mt-0.5 flex-shrink-0' />
                                 )}
                                 <div className='flex-1'>
                                    <p className='font-medium mb-2'>{question.question}</p>
                                    <p className='text-sm text-muted-foreground'>
                                       Tu respuesta: {wasAnswered ? question.options[answers[index]!] : "No respondida"}
                                    </p>
                                    {!isCorrect && <p className='text-sm text-green-600'>Respuesta correcta: {question.options[question.correct]}</p>}
                                    
                                    {/* Mostrar explicación si está disponible */}
                                    {question.explanation && (
                                       <div className='mt-3 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg'>
                                          <div className='flex items-start gap-2'>
                                             <div className='w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5'>
                                                <span className='text-white text-xs font-bold'>i</span>
                                             </div>
                                             <div className='text-sm text-blue-800 dark:text-blue-200'>
                                                <p className='font-medium mb-1'>Explicación:</p>
                                                <p>{question.explanation}</p>
                                             </div>
                                          </div>
                                       </div>
                                    )}

                                    {/* Botón para remover de preguntas falladas si es un test de falladas y se respondió correctamente */}
                                    {isFailedQuestionsTest && isCorrect && (
                                       <Button
                                          onClick={() => handleRemoveFromFailed(index)}
                                          variant='outline'
                                          size='sm'
                                          className='mt-2 text-green-600 border-green-200 hover:bg-green-50'>
                                          ✓ Remover de repaso
                                       </Button>
                                    )}
                                 </div>
                              </div>
                           </div>
                        );
                     })}
                  </div>

                  <div className='flex gap-4 justify-center'>
                     <Button onClick={resetTest} variant='outline'>
                        Repetir Test
                     </Button>
                     <Button onClick={onBack}>Volver al Inicio</Button>
                  </div>
               </CardContent>
            </Card>
         </div>
      );
   }

   return (
      <div className='max-w-2xl mx-auto p-6'>
         <div className='mb-4'>
            <Button onClick={onBack} variant='outline' size='sm'>
               <ChevronLeft className='w-4 h-4 mr-1' />
               Volver
            </Button>
         </div>

         <Card>
            <CardHeader>
               <div className='flex justify-between items-center'>
                  <div>
                     <CardTitle>{testName}</CardTitle>
                     {isFailedQuestionsTest && (
                        <div className='flex items-center gap-2 mt-1 text-orange-600'>
                           <AlertTriangle className='w-4 h-4' />
                           <span className='text-sm'>Repaso de preguntas falladas</span>
                        </div>
                     )}
                  </div>
                  <div className='text-sm text-muted-foreground'>
                     {currentQuestion + 1} / {testData.length}
                  </div>
               </div>
               <div className='w-full bg-muted rounded-full h-2'>
                  <div
                     className={`h-2 rounded-full transition-all duration-300 ${isFailedQuestionsTest ? "bg-orange-500" : "bg-primary"}`}
                     style={{ width: `${((currentQuestion + 1) / testData.length) * 100}%` }}
                  />
               </div>
            </CardHeader>

            <CardContent className='space-y-6'>
               <div>
                  <h3 className='text-lg font-medium mb-4'>{testData[currentQuestion].question}</h3>

                  <div className='space-y-3'>
                     {testData[currentQuestion].options.map((option, index) => (
                        <button
                           key={index}
                           onClick={() => handleAnswerSelect(index)}
                           className={`w-full p-4 text-left border rounded-lg transition-colors ${
                              selectedAnswer === index
                                 ? isFailedQuestionsTest
                                    ? "border-orange-500 bg-orange-50"
                                    : "border-primary bg-primary/10"
                                 : "border-border hover:border-muted-foreground hover:bg-muted/50"
                           }`}>
                           <div className='flex items-center gap-3'>
                              <div
                                 className={`w-4 h-4 rounded-full border-2 ${
                                    selectedAnswer === index
                                       ? isFailedQuestionsTest
                                          ? "border-orange-500 bg-orange-500"
                                          : "border-primary bg-primary"
                                       : "border-muted-foreground"
                                 }`}
                              />
                              <span className='w-11/12'>{option}</span>
                           </div>
                        </button>
                     ))}
                  </div>
               </div>

               <div className='flex justify-between'>
                  <Button onClick={handlePrevious} disabled={currentQuestion === 0} variant='outline'>
                     Anterior
                  </Button>

                  <Button
                     onClick={handleNext}
                     disabled={selectedAnswer === null}
                     className={isFailedQuestionsTest ? "bg-orange-500 hover:bg-orange-600" : ""}>
                     {currentQuestion === testData.length - 1 ? "Finalizar" : "Siguiente"}
                  </Button>
               </div>
            </CardContent>
         </Card>
      </div>
   );
};
