import { describe, it, expect } from 'vitest';
import { interpretarExamesComIA } from './interpretarExames';
import * as fs from 'fs';
import * as path from 'path';

describe('Debug TTGO Extraction', () => {
  it('should extract TTGO values from Patricia.pdf', async () => {
    // Ler o PDF da Patricia
    const pdfPath = '/home/ubuntu/upload/Patricia.pdf';
    const fileBuffer = fs.readFileSync(pdfPath);
    
    console.log('\n========== TESTE DE EXTRAÇÃO DO TTGO ==========');
    console.log('Arquivo:', pdfPath);
    console.log('Tamanho:', fileBuffer.length, 'bytes');
    console.log('Trimestre:', 'segundo');
    console.log('===============================================\n');
    
    // Chamar a função de interpretação
    const resultado = await interpretarExamesComIA(
      fileBuffer,
      'application/pdf',
      'segundo'
    );
    
    console.log('\n========== RESULTADO DA IA ==========');
    console.log('Data de coleta:', resultado.dataColeta);
    console.log('Número de exames extraídos:', Object.keys(resultado.resultados).length);
    console.log('\nExames extraídos:');
    for (const [chave, valor] of Object.entries(resultado.resultados)) {
      console.log(`  - ${chave}: ${valor}`);
    }
    console.log('=====================================\n');
    
    // Verificar se TTGO foi extraído
    const ttgoJejum = resultado.resultados['TTGO 75g (Curva Glicêmica)__Jejum'];
    const ttgo1h = resultado.resultados['TTGO 75g (Curva Glicêmica)__1 hora'];
    const ttgo2h = resultado.resultados['TTGO 75g (Curva Glicêmica)__2 horas'];
    
    console.log('\n========== VERIFICAÇÃO DO TTGO ==========');
    console.log('TTGO Jejum:', ttgoJejum || 'NÃO EXTRAÍDO ❌');
    console.log('TTGO 1 hora:', ttgo1h || 'NÃO EXTRAÍDO ❌');
    console.log('TTGO 2 horas:', ttgo2h || 'NÃO EXTRAÍDO ❌');
    console.log('=========================================\n');
    
    // Asserções
    expect(ttgoJejum).toBeDefined();
    expect(ttgo1h).toBeDefined();
    expect(ttgo2h).toBeDefined();
    
    expect(ttgoJejum).toContain('71');
    expect(ttgo1h).toContain('156');
    expect(ttgo2h).toContain('109');
  }, 60000); // Timeout de 60 segundos
});
