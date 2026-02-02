import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const execAsync = promisify(exec);

interface PdfCheckResult {
  isProtected: boolean;
  needsPassword: boolean;
  error?: string;
}

interface PdfUnlockResult {
  success: boolean;
  unlockedBuffer?: Buffer;
  error?: string;
}

/**
 * Verifica se um PDF está protegido por senha usando qpdf
 */
export async function checkPdfProtection(pdfBuffer: Buffer): Promise<PdfCheckResult> {
  const tempDir = os.tmpdir();
  const tempFile = path.join(tempDir, `pdf-check-${Date.now()}.pdf`);
  
  try {
    // Salvar o buffer em um arquivo temporário
    await fs.promises.writeFile(tempFile, pdfBuffer);
    
    // Usar qpdf para verificar se o PDF está protegido
    try {
      await execAsync(`qpdf --check "${tempFile}"`);
      // Se não houver erro, o PDF não está protegido
      return { isProtected: false, needsPassword: false };
    } catch (error: any) {
      const stderr = error.stderr || error.message || '';
      
      // Verificar se o erro é relacionado a senha
      if (stderr.includes('password') || 
          stderr.includes('encrypted') ||
          stderr.includes('Password') ||
          stderr.includes('Encrypted')) {
        return { isProtected: true, needsPassword: true };
      }
      
      // Outro tipo de erro - assumir que não está protegido
      console.warn('[pdfUtils] Erro ao verificar PDF:', stderr);
      return { isProtected: false, needsPassword: false };
    }
  } catch (error: any) {
    console.error('[pdfUtils] Erro ao processar PDF:', error);
    return { 
      isProtected: false, 
      needsPassword: false, 
      error: error.message 
    };
  } finally {
    // Limpar arquivo temporário
    try {
      await fs.promises.unlink(tempFile);
    } catch (e) {
      // Ignorar erro de limpeza
    }
  }
}

/**
 * Desbloqueia um PDF protegido por senha usando qpdf
 */
export async function unlockPdf(pdfBuffer: Buffer, password: string): Promise<PdfUnlockResult> {
  const tempDir = os.tmpdir();
  const inputFile = path.join(tempDir, `pdf-input-${Date.now()}.pdf`);
  const outputFile = path.join(tempDir, `pdf-output-${Date.now()}.pdf`);
  
  try {
    // Salvar o buffer em um arquivo temporário
    await fs.promises.writeFile(inputFile, pdfBuffer);
    
    // Usar qpdf para desbloquear o PDF
    try {
      await execAsync(`qpdf --decrypt --password="${password}" "${inputFile}" "${outputFile}"`);
      
      // Ler o arquivo desbloqueado
      const unlockedBuffer = await fs.promises.readFile(outputFile);
      
      return { success: true, unlockedBuffer };
    } catch (error: any) {
      const stderr = error.stderr || error.message || '';
      
      // Verificar se o erro é de senha incorreta
      if (stderr.includes('invalid password') || 
          stderr.includes('incorrect password') ||
          stderr.includes('wrong password') ||
          stderr.includes('Password') ||
          stderr.includes('password')) {
        return { 
          success: false, 
          error: 'Senha incorreta. Por favor, tente novamente.' 
        };
      }
      
      return { 
        success: false, 
        error: `Erro ao desbloquear PDF: ${stderr}` 
      };
    }
  } catch (error: any) {
    console.error('[pdfUtils] Erro ao processar PDF:', error);
    return { 
      success: false, 
      error: error.message 
    };
  } finally {
    // Limpar arquivos temporários
    try {
      await fs.promises.unlink(inputFile);
    } catch (e) {}
    try {
      await fs.promises.unlink(outputFile);
    } catch (e) {}
  }
}
