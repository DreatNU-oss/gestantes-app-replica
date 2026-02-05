import puppeteer from 'puppeteer';
import fs from 'fs';

(async () => {
  try {
    console.log('Iniciando browser...');
    const browser = await puppeteer.launch({
      headless: true,
      executablePath: '/usr/bin/chromium-browser',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
    });
    console.log('Browser iniciado!');
    const page = await browser.newPage();
    await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 2 });
    console.log('Navegando para página...');
    await page.goto('http://localhost:3000/cartao-prenatal-impressao/1', { waitUntil: 'networkidle0', timeout: 60000 });
    console.log('Página carregada!');
    
    // Aguardar data-content-loaded
    console.log('Aguardando data-content-loaded...');
    await page.waitForFunction(
      () => document.body.getAttribute('data-content-loaded') === 'true',
      { timeout: 30000 }
    );
    console.log('Conteúdo carregado!');
    
    // Aguardar gráficos
    console.log('Aguardando gráficos...');
    await page.waitForFunction(
      () => document.querySelectorAll('canvas').length >= 3,
      { timeout: 15000 }
    ).catch(() => console.log('Timeout aguardando gráficos, continuando...'));
    
    // Aguardar mais tempo para gráficos renderizarem
    await new Promise(r => setTimeout(r, 3000));
    console.log('Aguardou 3s extras');
    
    console.log('Gerando PDF...');
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' }
    });
    console.log('PDF gerado! Tamanho:', pdf.length, 'bytes');
    
    fs.writeFileSync('/home/ubuntu/teste_puppeteer2.pdf', pdf);
    console.log('PDF salvo em /home/ubuntu/teste_puppeteer2.pdf');
    
    await browser.close();
    console.log('Sucesso!');
  } catch (e) {
    console.error('Erro:', e.message);
    console.error(e.stack);
  }
})();
