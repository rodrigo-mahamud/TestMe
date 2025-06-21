import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { TestComponent } from './TestComponent';
import { BookOpen, Network, FileText, List, AlertTriangle, RotateCcw, Trash2 } from 'lucide-react';
import { FailedQuestionsManager } from '../utils/failedQuestionsManager';
import { ThemeProvider, ThemeToggle } from './theme';
// Importar utilidades de desarrollo
import '../utils/fileSystemHelper';

interface Question {
  question: string;
  options: string[];
  correct: number;
  explanation?: string;
}

interface TestFile {
  filename: string;
  name: string;
  questionCount: number;
  questions: Question[];
  isFailedQuestions?: boolean;
}

interface TestCategory {
  name: string;
  folder: string;
  icon: React.ReactNode;
  description: string;
  tests: TestFile[];
  failedCount: number;
}

// Mapeo de iconos para categorías
const getCategoryIcon = (categoryFolder: string) => {
  const iconMap: Record<string, React.ReactNode> = {
    comercioElectronico: <BookOpen className="w-6 h-6" />,
    redesAvanzadas: <Network className="w-6 h-6" />,
    // Agregar más iconos aquí según sea necesario
  };
  
  return iconMap[categoryFolder] || <FileText className="w-6 h-6" />;
};

// Mapeo de descripciones para categorías
const getCategoryDescription = (categoryFolder: string) => {
  const descriptionMap: Record<string, string> = {
    comercioElectronico: 'Tests sobre conceptos de e-commerce y venta online',
    redesAvanzadas: 'Tests sobre protocolos de red y infraestructura',
    // Agregar más descripciones aquí
  };
  
  return descriptionMap[categoryFolder] || 'Tests de conocimientos técnicos';
};

// Formatear nombre de categoría
const formatCategoryName = (categoryFolder: string) => {
  const nameMap: Record<string, string> = {
    comercioElectronico: 'Comercio Electrónico',
    redesAvanzadas: 'Redes Avanzadas',
    // Agregar más nombres aquí
  };
  
  return nameMap[categoryFolder] || categoryFolder
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase());
};

const TestAppContent: React.FC = () => {
  const [categories, setCategories] = useState<TestCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<TestCategory | null>(null);
  const [selectedTest, setSelectedTest] = useState<{
    data: Question[];
    name: string;
    category: string;
    isFailedQuestions?: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    initializeCategories();
  }, []);

  const initializeCategories = async () => {
    setInitialLoading(true);
    try {
      // Obtener estructura de tests desde la API
      const response = await fetch('/api/tests');
      if (!response.ok) {
        throw new Error('Failed to fetch tests structure');
      }
      
      const testsStructure = await response.json();
      
      const categoriesWithTests: TestCategory[] = [];
      
      // Procesar cada categoría encontrada
      Object.entries(testsStructure).forEach(([categoryFolder, tests]: [string, any]) => {
        const failedCount = FailedQuestionsManager.getFailedQuestionsByCategory(categoryFolder).length;
        
        // Convertir tests y agregar test de preguntas falladas si existe
        const processedTests: TestFile[] = [...tests];
        
        if (failedCount > 0) {
          processedTests.unshift({
            filename: 'failed-questions-localStorage',
            name: `Repaso (${failedCount} preguntas)`,
            questionCount: failedCount,
            questions: [],
            isFailedQuestions: true
          });
        }
        
        const category: TestCategory = {
          name: formatCategoryName(categoryFolder),
          folder: categoryFolder,
          icon: getCategoryIcon(categoryFolder),
          description: getCategoryDescription(categoryFolder),
          tests: processedTests,
          failedCount
        };
        
        categoriesWithTests.push(category);
      });

      setCategories(categoriesWithTests);
    } catch (error) {
      console.error('Error initializing categories:', error);
      // Fallback a las categorías hardcodeadas si la API falla
      setCategories([]);
    } finally {
      setInitialLoading(false);
    }
  };

  const loadTest = async (category: string, testFile: TestFile) => {
    setLoading(true);
    try {
      let testData: Question[];
      let testName: string;
      let isFailedQuestions = false;

      if (testFile.filename === 'failed-questions-localStorage') {
        // Cargar preguntas falladas desde localStorage únicamente
        const failedQuestions = FailedQuestionsManager.getFailedQuestionsByCategory(category);
        testData = failedQuestions.map(fq => ({
          question: fq.question,
          options: fq.options,
          correct: fq.correct
        }));
        
        const categoryName = categories.find(cat => cat.folder === category)?.name || category;
        testName = `${categoryName} - Repaso de Preguntas Falladas`;
        isFailedQuestions = true;
        
        if (testData.length === 0) {
          alert('No hay preguntas falladas para repasar en esta categoría.');
          setLoading(false);
          return;
        }
      } else {
        // Usar los datos que ya tenemos del test
        testData = testFile.questions;
        const categoryName = categories.find(cat => cat.folder === category)?.name || category;
        testName = `${categoryName} - ${testFile.name}`;
      }
      
      setSelectedTest({
        data: testData,
        name: testName,
        category: category,
        isFailedQuestions
      });
    } catch (error) {
      console.error('Error loading test:', error);
      alert('Error al cargar el test. Por favor, inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySelect = (category: TestCategory) => {
    if (category.tests.length === 1) {
      loadTest(category.folder, category.tests[0]);
    } else {
      setSelectedCategory(category);
    }
  };

  const handleTestSelect = async (category: string, testFile: TestFile) => {
    await loadTest(category, testFile);
  };

  const handleBackToHome = () => {
    setSelectedTest(null);
    setSelectedCategory(null);
    // Recargar categorías para actualizar contadores
    initializeCategories();
  };

  const handleBackToCategory = () => {
    setSelectedTest(null);
    // Recargar categorías para actualizar contadores
    initializeCategories();
  };

  const handleClearFailedQuestions = (category: string) => {
    const categoryName = categories.find(cat => cat.folder === category)?.name || category;
    
    if (confirm(`¿Estás seguro de que quieres eliminar todas las preguntas falladas de ${categoryName}?`)) {
      FailedQuestionsManager.clearFailedQuestions(category);
      initializeCategories();
      
      if (selectedCategory && selectedCategory.folder === category) {
        setSelectedCategory(null);
      }
    }
  };

  // Vista del test individual
  if (selectedTest) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="absolute top-4 right-4 z-10">
          <ThemeToggle />
        </div>
        <TestComponent
          testData={selectedTest.data}
          testName={selectedTest.name}
          category={selectedTest.category}
          onBack={selectedCategory ? handleBackToCategory : handleBackToHome}
          isFailedQuestionsTest={selectedTest.isFailedQuestions}
        />
      </div>
    );
  }

  // Vista de lista de tests de una categoría
  if (selectedCategory) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="absolute top-4 right-4 z-10">
          <ThemeToggle />
        </div>
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6 flex justify-between items-center">
            <Button onClick={handleBackToHome} variant="outline">
              ← Volver al inicio
            </Button>
            
            {selectedCategory.failedCount > 0 && (
              <Button 
                onClick={() => handleClearFailedQuestions(selectedCategory.folder)}
                variant="outline"
                size="sm"
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Limpiar preguntas falladas ({selectedCategory.failedCount})
              </Button>
            )}
          </div>

          <div className="text-center mb-8">
            <div className="flex justify-center mb-4 text-primary">
              {selectedCategory.icon}
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">{selectedCategory.name}</h1>
            <p className="text-lg text-muted-foreground">{selectedCategory.description}</p>
            
            {selectedCategory.failedCount > 0 && (
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-orange-50 border border-orange-200 rounded-lg text-orange-700">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {selectedCategory.failedCount} pregunta{selectedCategory.failedCount !== 1 ? 's' : ''} guardada{selectedCategory.failedCount !== 1 ? 's' : ''} para repasar
                </span>
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {selectedCategory.tests.map((test, index) => (
              <Card 
                key={test.filename} 
                className={`cursor-pointer transition-transform hover:scale-105 ${
                  test.isFailedQuestions ? 'border-orange-200 bg-orange-50' : ''
                }`}
              >
                <CardHeader className="text-center pb-3">
                  <div className={`flex justify-center mb-2 ${
                    test.isFailedQuestions ? 'text-orange-500' : 'text-primary'
                  }`}>
                    {test.isFailedQuestions ? (
                      <RotateCcw className="w-5 h-5" />
                    ) : (
                      <FileText className="w-5 h-5" />
                    )}
                  </div>
                  <CardTitle className={`text-lg ${
                    test.isFailedQuestions ? 'text-orange-700' : ''
                  }`}>
                    {test.name}
                  </CardTitle>
                  <CardDescription className={test.isFailedQuestions ? 'text-orange-600' : ''}>
                    {test.isFailedQuestions 
                      ? 'Preguntas guardadas en tu navegador'
                      : `${test.questionCount} pregunta${test.questionCount !== 1 ? 's' : ''}`
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center pt-0">
                  <Button 
                    onClick={() => handleTestSelect(selectedCategory.folder, test)}
                    disabled={loading}
                    className={`w-full ${
                      test.isFailedQuestions 
                        ? 'bg-orange-500 hover:bg-orange-600 text-white' 
                        : ''
                    }`}
                    size="sm"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Cargando...
                      </div>
                    ) : (
                      test.isFailedQuestions ? 'Repasar' : 'Iniciar'
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {selectedCategory.failedCount > 0 && (
            <div className="mt-8 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm">
                💾 Las preguntas falladas se guardan automáticamente en tu navegador
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Vista principal con categorías
  if (initialLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando tests disponibles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">TestMe</h1>
          <p className="text-lg text-muted-foreground">Plataforma de Tests Interactivos</p>
          <p className="text-sm text-muted-foreground mt-2">
            🧠 Las preguntas que falles se guardarán automáticamente para repaso
          </p>
        </div>

        {categories.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No se encontraron tests</h3>
            <p className="text-muted-foreground">
              Agrega archivos JSON en la carpeta <code className="bg-muted px-1 rounded">public/tests/</code>
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {categories.map((category) => (
              <Card key={category.folder} className="cursor-pointer transition-transform hover:scale-105">
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-4 text-primary">
                    {category.icon}
                  </div>
                  <CardTitle className="text-xl">{category.name}</CardTitle>
                  <CardDescription>{category.description}</CardDescription>
                  <div className="flex items-center justify-center gap-4 mt-3">
                    <div className="text-sm text-muted-foreground">
                      {category.tests.filter(t => !t.isFailedQuestions).length} test{category.tests.filter(t => !t.isFailedQuestions).length !== 1 ? 's' : ''} disponible{category.tests.filter(t => !t.isFailedQuestions).length !== 1 ? 's' : ''}
                    </div>
                    {category.failedCount > 0 && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-orange-100 rounded-full text-orange-700 text-xs">
                        <AlertTriangle className="w-3 h-3" />
                        <span>{category.failedCount} para repasar</span>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="text-center">
                  <Button 
                    onClick={() => handleCategorySelect(category)}
                    disabled={loading || category.tests.length === 0}
                    className="w-full"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Cargando...
                      </div>
                    ) : category.tests.length === 0 ? (
                      'No hay tests disponibles'
                    ) : category.tests.length === 1 ? (
                      <>
                        <FileText className="w-4 h-4 mr-2" />
                        Iniciar Test
                      </>
                    ) : (
                      <>
                        <List className="w-4 h-4 mr-2" />
                        Ver Tests ({category.tests.length})
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="text-center mt-12 text-muted-foreground">
          <p>
            {categories.length === 0 
              ? 'Agrega carpetas y archivos JSON en public/tests/ para comenzar'
              : 'Selecciona una categoría para comenzar tu test'
            }
          </p>
          <p className="text-xs mt-2">
            💡 Tip: Abre la consola del navegador (F12) y usa <code className="bg-muted px-1 rounded">TestMeHelper.showStats()</code> para ver estadísticas
          </p>
        </div>
      </div>
    </div>
  );
};

export const TestApp: React.FC = () => {
  return (
    <ThemeProvider defaultTheme="system" storageKey="testme-ui-theme">
      <TestAppContent />
    </ThemeProvider>
  );
};