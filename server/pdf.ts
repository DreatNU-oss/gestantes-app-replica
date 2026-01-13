import puppeteer from 'puppeteer';
import { ENV } from './_core/env';

/**
 * Gera PDF do Cartão de Pré-natal usando Puppeteer
 * Remove cabeçalhos e rodapés automáticos do navegador
 */
export async function gerarPDFCartaoPrenatal(gestanteId: number): Promise<Buffer> {
  let browser;
  
  try {
    // Iniciar navegador headless
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();
    
    // Construir URL da página de impressão (usar localhost pois Puppeteer roda no mesmo servidor)
    const baseUrl = 'http://localhost:3000';
    const url = `${baseUrl}/cartao-prenatal-impressao/${gestanteId}`;
    
    // Navegar para a página
    console.log('[PDF] Navegando para:', url);
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 60000
    });
    
    console.log('[PDF] Página carregada, aguardando renderização...');
    
    // Aguardar pelo logo (opcional, não falha se não encontrar)
    try {
      await page.waitForSelector('img[alt="Mais Mulher"]', { timeout: 5000 });
      console.log('[PDF] Logo encontrado');
    } catch (e) {
      console.log('[PDF] Logo não encontrado, continuando...');
    }
    
    // Aguardar mais um pouco para garantir que gráficos renderizaram
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log('[PDF] Iniciando geração do PDF...');
    
    // Gerar PDF com configurações profissionais
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '1cm',
        right: '1cm',
        bottom: '1cm',
        left: '1cm'
      },
      // Remover cabeçalhos e rodapés do navegador
      displayHeaderFooter: false
    });

    return Buffer.from(pdfBuffer);
    
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    throw new Error(`Falha ao gerar PDF: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
