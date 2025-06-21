import type { APIRoute } from 'astro';
import { promises as fs } from 'fs';
import path from 'path';

export const GET: APIRoute = async () => {
  try {
    const testsPath = path.join(process.cwd(), 'public', 'tests');
    
    // Leer todas las carpetas en /public/tests
    const categories = await fs.readdir(testsPath, { withFileTypes: true });
    
    const testsStructure: Record<string, any[]> = {};
    
    for (const category of categories) {
      if (category.isDirectory()) {
        const categoryPath = path.join(testsPath, category.name);
        const files = await fs.readdir(categoryPath);
        
        // Filtrar solo archivos JSON
        const jsonFiles = files.filter(file => file.endsWith('.json'));
        
        const tests = [];
        
        for (const file of jsonFiles) {
          try {
            const filePath = path.join(categoryPath, file);
            const fileContent = await fs.readFile(filePath, 'utf-8');
            const testData = JSON.parse(fileContent);
            
            // Extraer información del test
            const testInfo = {
              filename: file,
              name: file.replace('.json', '').replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
              questionCount: Array.isArray(testData) ? testData.length : 0,
              questions: testData
            };
            
            tests.push(testInfo);
          } catch (error) {
            console.error(`Error reading test file ${file}:`, error);
          }
        }
        
        // Ordenar tests por nombre de archivo
        tests.sort((a, b) => a.filename.localeCompare(b.filename));
        
        testsStructure[category.name] = tests;
      }
    }
    
    return new Response(JSON.stringify(testsStructure), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error scanning tests directory:', error);
    return new Response(JSON.stringify({ error: 'Failed to scan tests' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
};