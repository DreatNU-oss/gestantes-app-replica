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
      waitUntil: 'networkidle0', // Aguarda até não haver mais requisições de rede
      timeout: 90000 // Aumentado para 90 segundos
    });
    
    console.log('[PDF] Página carregada, aguardando renderização completa...');
    
    // Aguardar que o conteúdo principal esteja renderizado
    // Usar um seletor mais genérico e confiável
    await page.waitForSelector('body', { timeout: 10000 });
    
    // Aguardar tempo adicional para garantir que todos os recursos foram carregados
    // Isso evita o erro "Execution context was destroyed"
    await page.evaluate(() => {
      return new Promise((resolve) => {
        // Aguardar que todas as imagens estejam carregadas
        const images = Array.from(document.images);
        const promises = images.map(img => {
          if (img.complete) return Promise.resolve();
          return new Promise(resolve => {
            img.onload = resolve;
            img.onerror = resolve; // Resolver mesmo se houver erro
          });
        });
        Promise.all(promises).then(resolve);
      });
    });
    
    console.log('[PDF] Todos os recursos carregados, aguardando estabilização...');
    
    // Aguardar mais um pouco para garantir que gráficos e outros elementos dinâmicos renderizaram
    await new Promise(resolve => setTimeout(resolve, 2000));
    
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
