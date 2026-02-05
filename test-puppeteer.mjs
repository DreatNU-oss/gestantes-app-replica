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
    await page.goto('http://localhost:3000/cartao-prenatal-impressao/1', { waitUntil: 'networkidle0', timeout: 30000 });
    console.log('Página carregada!');
    
    // Aguardar um pouco para gráficos
    await new Promise(r => setTimeout(r, 2000));
    
    console.log('Gerando PDF...');
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' }
    });
    console.log('PDF gerado! Tamanho:', pdf.length, 'bytes');
    
    // Salvar PDF para teste
    fs.writeFileSync('/home/ubuntu/teste_puppeteer.pdf', pdf);
    console.log('PDF salvo em /home/ubuntu/teste_puppeteer.pdf');
    
    await browser.close();
    console.log('Sucesso!');
  } catch (e) {
    console.error('Erro:', e.message);
    console.error(e.stack);
  }
})();
