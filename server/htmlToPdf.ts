import puppeteer from 'puppeteer';

/**
 * Converte HTML para PDF usando Puppeteer (headless Chrome)
 * Esta é uma solução 100% JavaScript que funciona em qualquer ambiente Node.js
 */
export async function htmlToPdf(html: string): Promise<Buffer> {
  let browser = null;
  
  try {
    console.log('[htmlToPdf] Iniciando geração de PDF com Puppeteer...');
    
    // Iniciar o browser headless
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-software-rasterizer',
      ],
    });

    const page = await browser.newPage();

    // Definir o conteúdo HTML
    await page.setContent(html, {
      waitUntil: 'networkidle0',
      timeout: 30000,
    });

    // Gerar o PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '10mm',
        right: '10mm',
        bottom: '10mm',
        left: '10mm',
      },
    });

    console.log('[htmlToPdf] PDF gerado com sucesso via Puppeteer');
    
    return Buffer.from(pdfBuffer);
  } catch (error) {
    console.error('[htmlToPdf] Erro ao gerar PDF:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
