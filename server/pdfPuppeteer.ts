import puppeteer from 'puppeteer';

/**
 * Gera PDF do Cartão de Pré-natal usando Puppeteer
 * Renderiza a página HTML de impressão e converte para PDF
 */
export async function gerarPDFComPuppeteer(
  gestanteId: number, 
  baseUrl: string,
  cookies?: { name: string; value: string; domain?: string }[]
): Promise<Buffer> {
  console.log('[PDF Puppeteer] Iniciando geração de PDF para gestante:', gestanteId);
  console.log('[PDF Puppeteer] Base URL:', baseUrl);
  console.log('[PDF Puppeteer] Cookies recebidos:', cookies?.length || 0);
  
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--font-render-hinting=none',
      '--disable-software-rasterizer',
    ],
  });

  try {
    const page = await browser.newPage();
    
    // Configurar cookies de autenticação se fornecidos
    if (cookies && cookies.length > 0) {
      // Extrair domínio da baseUrl
      const urlObj = new URL(baseUrl);
      const domain = urlObj.hostname;
      
      const puppeteerCookies = cookies.map(c => ({
        name: c.name,
        value: c.value,
        domain: c.domain || domain,
        path: '/',
      }));
      
      console.log('[PDF Puppeteer] Configurando cookies para domínio:', domain);
      await page.setCookie(...puppeteerCookies);
    }
    
    // Configurar viewport para A4
    await page.setViewport({
      width: 794, // A4 width in pixels at 96 DPI
      height: 1123, // A4 height in pixels at 96 DPI
      deviceScaleFactor: 2, // Alta resolução
    });

    // Navegar para a página de impressão
    const url = `${baseUrl}/cartao-prenatal-impressao/${gestanteId}`;
    console.log('[PDF Puppeteer] Navegando para:', url);
    
    try {
      const response = await page.goto(url, {
        waitUntil: 'networkidle0',
        timeout: 60000,
      });
      
      if (!response) {
        throw new Error('Nenhuma resposta recebida da página');
      }
      
      console.log('[PDF Puppeteer] Status da resposta:', response.status());
      
      if (response.status() !== 200) {
        throw new Error(`Página retornou status ${response.status()}`);
      }
    } catch (navError) {
      console.error('[PDF Puppeteer] Erro na navegação:', navError);
      throw navError;
    }

    // Aguardar o conteúdo ser carregado (o componente React adiciona um atributo quando pronto)
    console.log('[PDF Puppeteer] Aguardando data-content-loaded...');
    await page.waitForFunction(
      () => document.body.getAttribute('data-content-loaded') === 'true',
      { timeout: 30000 }
    );
    console.log('[PDF Puppeteer] Conteúdo carregado!');

    // Aguardar gráficos renderizarem (canvas elements)
    console.log('[PDF Puppeteer] Aguardando gráficos...');
    await page.waitForFunction(
      () => document.querySelectorAll('canvas').length >= 3,
      { timeout: 15000 }
    ).catch(() => console.log('[PDF Puppeteer] Timeout aguardando gráficos, continuando...'));
    
    // Aguardar um pouco mais para gráficos renderizarem completamente
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log('[PDF Puppeteer] Aguardou 3s extras para gráficos');

    console.log('[PDF Puppeteer] Página carregada, gerando PDF...');

    // Gerar PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '10mm',
        right: '10mm',
        bottom: '10mm',
        left: '10mm',
      },
      displayHeaderFooter: false,
    });

    console.log('[PDF Puppeteer] PDF gerado com sucesso, tamanho:', pdfBuffer.length, 'bytes');
    
    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}
