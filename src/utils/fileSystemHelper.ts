import { FailedQuestionsManager } from './failedQuestionsManager';

interface Question {
  question: string;
  options: string[];
  correct: number;
}

export class DevHelper {
  
  // Función para mostrar estadísticas
  static showStats(): void {
    const stats = FailedQuestionsManager.getFailedQuestionsStats();
    const totalFailed = Object.values(stats).reduce((sum, count) => sum + count, 0);
    
    console.log(`
📊 ESTADÍSTICAS DE PREGUNTAS FALLADAS
═══════════════════════════════════════

📈 Total de preguntas falladas: ${totalFailed}

📂 Por categoría:
${Object.entries(stats).map(([category, count]) => 
  `   • ${category}: ${count} pregunta${count !== 1 ? 's' : ''}`
).join('\n')}

🔄 Última actualización: ${new Date().toLocaleString()}

💾 Almacenado en: localStorage
    `);
  }

  // Función para exportar backup
  static exportBackup(): string {
    const backup = FailedQuestionsManager.exportFailedQuestions();
    console.log(`
📦 BACKUP DE PREGUNTAS FALLADAS
═══════════════════════════════

📋 Copia el siguiente JSON para hacer backup:

${backup}

💡 Para restaurar, usa: TestMeHelper.importBackup('...')
    `);
    return backup;
  }

  // Función para importar backup
  static importBackup(jsonData: string): boolean {
    const success = FailedQuestionsManager.importFailedQuestions(jsonData);
    if (success) {
      this.showStats();
    }
    return success;
  }

  // Limpiar todo
  static clearAll(): void {
    if (confirm('⚠️ ¿Estás seguro de que quieres eliminar TODAS las preguntas falladas?')) {
      localStorage.removeItem('testme_failed_questions');
      console.log('🗑️ Todas las preguntas falladas han sido eliminadas');
    }
  }

  // Función para añadir preguntas de prueba
  static addTestData(): void {
    const testQuestions: Record<string, Question[]> = {
      comercioElectronico: [
        {
          question: "¿Qué significa SEO?",
          options: ["Search Engine Optimization", "Sales Enhancement Operations", "Secure Electronic Operations", "Social E-commerce Optimization"],
          correct: 0
        }
      ],
      redesAvanzadas: [
        {
          question: "¿Qué es BGP?",
          options: ["Border Gateway Protocol", "Basic Gateway Protocol", "Broadcast Group Protocol", "Binary Gateway Protocol"],
          correct: 0
        }
      ]
    };

    Object.entries(testQuestions).forEach(([category, questions]) => {
      questions.forEach(question => {
        FailedQuestionsManager.addFailedQuestion(category, 'test-data', question);
      });
    });

    console.log('📝 Datos de prueba añadidos');
    this.showStats();
  }
}

// Funciones de utilidad global para usar en la consola del navegador
declare global {
  interface Window {
    TestMeHelper: {
      showStats: () => void;
      exportBackup: () => string;
      importBackup: (jsonData: string) => boolean;
      clearCategory: (category: string) => void;
      clearAll: () => void;
      addTestData: () => void;
    };
  }
}

// Exponer funciones útiles en el objeto window para debugging
if (typeof window !== 'undefined') {
  window.TestMeHelper = {
    showStats: () => DevHelper.showStats(),
    exportBackup: () => DevHelper.exportBackup(),
    importBackup: (jsonData: string) => DevHelper.importBackup(jsonData),
    clearCategory: (category: string) => FailedQuestionsManager.clearFailedQuestions(category),
    clearAll: () => DevHelper.clearAll(),
    addTestData: () => DevHelper.addTestData()
  };
}