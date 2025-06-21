interface Question {
  question: string;
  options: string[];
  correct: number;
  explanation?: string;
}

interface FailedQuestion extends Question {
  category: string;
  testName: string;
  failedAt: string;
}

export class FailedQuestionsManager {
  private static STORAGE_KEY = 'testme_failed_questions';

  // Obtener preguntas falladas del localStorage
  static getFailedQuestions(): Record<string, FailedQuestion[]> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Error loading failed questions:', error);
      return {};
    }
  }

  // Guardar preguntas falladas en localStorage
  static saveFailedQuestions(failedQuestions: Record<string, FailedQuestion[]>): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(failedQuestions));
    } catch (error) {
      console.error('Error saving failed questions:', error);
    }
  }

  // Agregar una pregunta fallada
  static addFailedQuestion(
    category: string,
    testName: string,
    question: Question
  ): void {
    const failedQuestions = this.getFailedQuestions();
    
    if (!failedQuestions[category]) {
      failedQuestions[category] = [];
    }

    // Comprobar si la pregunta ya existe para evitar duplicados
    const exists = failedQuestions[category].some(
      (fq) => 
        fq.question === question.question && 
        fq.correct === question.correct &&
        JSON.stringify(fq.options) === JSON.stringify(question.options)
    );

    if (!exists) {
      const failedQuestion: FailedQuestion = {
        ...question,
        category,
        testName,
        failedAt: new Date().toISOString()
      };

      failedQuestions[category].push(failedQuestion);
      this.saveFailedQuestions(failedQuestions);
      
      console.log(`📝 Pregunta añadida a repaso en ${category}:`, question.question);
    } else {
      console.log(`ℹ️ Pregunta ya existe en repaso para ${category}`);
    }
  }

  // Obtener preguntas falladas de una categoría específica
  static getFailedQuestionsByCategory(category: string): FailedQuestion[] {
    const failedQuestions = this.getFailedQuestions();
    return failedQuestions[category] || [];
  }

  // Limpiar preguntas falladas de una categoría
  static clearFailedQuestions(category: string): void {
    const failedQuestions = this.getFailedQuestions();
    delete failedQuestions[category];
    this.saveFailedQuestions(failedQuestions);
    console.log(`🗑️ Preguntas falladas eliminadas para ${category}`);
  }

  // Remover una pregunta específica de las falladas
  static removeFailedQuestion(category: string, questionIndex: number): void {
    const failedQuestions = this.getFailedQuestions();
    
    if (failedQuestions[category] && failedQuestions[category][questionIndex]) {
      const removedQuestion = failedQuestions[category][questionIndex];
      failedQuestions[category].splice(questionIndex, 1);
      
      if (failedQuestions[category].length === 0) {
        delete failedQuestions[category];
      }
      
      this.saveFailedQuestions(failedQuestions);
      console.log(`✅ Pregunta removida del repaso:`, removedQuestion.question);
    }
  }

  // Verificar si hay preguntas falladas para una categoría
  static hasFailedQuestions(category: string): boolean {
    const failed = this.getFailedQuestionsByCategory(category);
    return failed.length > 0;
  }

  // Obtener estadísticas de preguntas falladas
  static getFailedQuestionsStats(): Record<string, number> {
    const failedQuestions = this.getFailedQuestions();
    const stats: Record<string, number> = {};
    
    Object.keys(failedQuestions).forEach(category => {
      stats[category] = failedQuestions[category].length;
    });
    
    return stats;
  }

  // Exportar preguntas falladas para backup
  static exportFailedQuestions(): string {
    const failedQuestions = this.getFailedQuestions();
    return JSON.stringify(failedQuestions, null, 2);
  }

  // Importar preguntas falladas desde backup
  static importFailedQuestions(jsonData: string): boolean {
    try {
      const imported = JSON.parse(jsonData);
      this.saveFailedQuestions(imported);
      console.log('✅ Preguntas falladas importadas correctamente');
      return true;
    } catch (error) {
      console.error('❌ Error importando preguntas falladas:', error);
      return false;
    }
  }
}