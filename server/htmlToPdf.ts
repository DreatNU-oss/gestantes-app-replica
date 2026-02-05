import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const execAsync = promisify(exec);

/**
 * Converte HTML para PDF usando WeasyPrint
 * WeasyPrint é uma biblioteca Python que converte HTML/CSS para PDF
 * Tenta diferentes métodos de execução para compatibilidade
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

    // Limpar variáveis de ambiente Python para evitar conflitos
    const cleanEnv = { ...process.env };
    delete cleanEnv.VIRTUAL_ENV;
    delete cleanEnv.PYTHONPATH;
    delete cleanEnv.PYTHONHOME;

    // Lista de comandos para tentar (em ordem de preferência)
    const commands = [
      `weasyprint "${htmlPath}" "${pdfPath}"`,                    // Comando direto (mais comum em produção)
      `python3 -m weasyprint "${htmlPath}" "${pdfPath}"`,         // Via python3
      `python -m weasyprint "${htmlPath}" "${pdfPath}"`,          // Via python
      `/usr/bin/python3.11 -m weasyprint "${htmlPath}" "${pdfPath}"`, // Python 3.11 específico (sandbox)
      `/usr/bin/python3 -m weasyprint "${htmlPath}" "${pdfPath}"`,    // Python 3 específico
    ];

    let lastError: Error | null = null;

    for (const cmd of commands) {
      try {
        await execAsync(cmd, {
          timeout: 60000, // 60 segundos de timeout
          env: cleanEnv,
        });

        // Se chegou aqui, o comando funcionou
        // Verificar se o PDF foi gerado
        if (fs.existsSync(pdfPath)) {
          const pdfBuffer = await fs.promises.readFile(pdfPath);
          if (pdfBuffer.length > 0) {
            console.log(`[htmlToPdf] PDF gerado com sucesso usando: ${cmd.split(' ')[0]}`);
            return pdfBuffer;
          }
        }
      } catch (error) {
        lastError = error as Error;
        // Continuar tentando outros comandos
        continue;
      }
    }

    // Se nenhum comando funcionou, lançar o último erro
    throw lastError || new Error('Nenhum método de conversão PDF disponível');

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
