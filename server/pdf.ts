import puppeteer from 'puppeteer';
import { writeFileSync } from 'fs';
import { buscarDadosCartaoPrenatal } from './pdfData';
import { gerarHTMLCartaoPrenatal } from './pdfTemplate';

/**
 * Gera PDF do Cartão de Pré-natal usando Puppeteer
 * Gera o HTML no servidor e converte diretamente para PDF sem precisar acessar via HTTP
 */
export async function gerarPDFCartaoPrenatal(gestanteId: number): Promise<Buffer> {
  let browser;
  
  try {
    console.log('[PDF] Buscando dados da gestante:', gestanteId);
    
    // Buscar todos os dados necessários
    const dados = await buscarDadosCartaoPrenatal(gestanteId);
    
    console.log('[PDF] Gerando HTML do cartão pré-natal...');
    
    // Gerar HTML completo
    const html = gerarHTMLCartaoPrenatal(dados);
    
    // Salvar HTML para debug (opcional)
    writeFileSync(`/tmp/pdf_html_${gestanteId}.html`, html);
    console.log(`[PDF] HTML salvo em /tmp/pdf_html_${gestanteId}.html`);
    
    console.log('[PDF] Iniciando navegador Puppeteer...');
    
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
    
    console.log('[PDF] Carregando HTML no Puppeteer...');
    
    // Carregar HTML diretamente (sem precisar de URL)
    await page.setContent(html, {
      waitUntil: 'networkidle0',
      timeout: 30000
    });
    
    console.log('[PDF] HTML carregado, gerando PDF...');
    
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
      displayHeaderFooter: false
    });

    console.log('[PDF] PDF gerado com sucesso!');
    
    return Buffer.from(pdfBuffer);
    
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    writeFileSync('/tmp/pdf_erro.txt', `Erro ao gerar PDF em ${new Date().toISOString()}:\n${error instanceof Error ? error.stack : String(error)}`);
    throw new Error(`Falha ao gerar PDF: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
