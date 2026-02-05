import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const execAsync = promisify(exec);

/**
 * Converte HTML para PDF usando WeasyPrint
 * WeasyPrint é uma biblioteca Python que converte HTML/CSS para PDF
 * Já está instalado no ambiente do Manus
 */
export async function htmlToPdf(html: string): Promise<Buffer> {
  // Criar arquivos temporários
  const tempDir = os.tmpdir();
  const timestamp = Date.now();
  const htmlPath = path.join(tempDir, `cartao-${timestamp}.html`);
  const pdfPath = path.join(tempDir, `cartao-${timestamp}.pdf`);

  try {
    // Escrever HTML no arquivo temporário
    await fs.promises.writeFile(htmlPath, html, 'utf-8');

    // Executar WeasyPrint para converter HTML para PDF
    // Limpar VIRTUAL_ENV e PYTHONPATH para evitar conflitos de versão
    const cleanEnv = { ...process.env };
    delete cleanEnv.VIRTUAL_ENV;
    delete cleanEnv.PYTHONPATH;
    delete cleanEnv.PYTHONHOME;
    
    await execAsync(`/usr/bin/python3.11 -m weasyprint "${htmlPath}" "${pdfPath}"`, {
      timeout: 60000, // 60 segundos de timeout (gráficos podem demorar)
      env: cleanEnv,
    });

    // Ler o PDF gerado
    const pdfBuffer = await fs.promises.readFile(pdfPath);

    return pdfBuffer;
  } finally {
    // Limpar arquivos temporários
    try {
      await fs.promises.unlink(htmlPath);
    } catch (e) {
      // Ignorar erro se arquivo não existir
    }
    try {
      await fs.promises.unlink(pdfPath);
    } catch (e) {
      // Ignorar erro se arquivo não existir
    }
  }
}
