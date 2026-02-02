import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock do child_process antes de importar o módulo
vi.mock('child_process', () => ({
  exec: vi.fn()
}));

// Mock do fs
vi.mock('fs', () => ({
  promises: {
    writeFile: vi.fn().mockResolvedValue(undefined),
    readFile: vi.fn().mockResolvedValue(Buffer.from('unlocked pdf content')),
    unlink: vi.fn().mockResolvedValue(undefined),
  }
}));

import { checkPdfProtection, unlockPdf } from './pdfUtils';
import { exec } from 'child_process';

describe('pdfUtils', () => {
  const mockExec = exec as unknown as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkPdfProtection', () => {
    it('deve retornar isProtected=false para PDF não protegido', async () => {
      // Simular qpdf --check retornando sucesso (PDF não protegido)
      mockExec.mockImplementation((cmd: string, callback: (error: any, stdout: string, stderr: string) => void) => {
        callback(null, 'PDF is valid', '');
      });

      const pdfBuffer = Buffer.from('fake pdf content');
      const result = await checkPdfProtection(pdfBuffer);

      expect(result.isProtected).toBe(false);
      expect(result.needsPassword).toBe(false);
    });

    it('deve retornar needsPassword=true para PDF protegido por senha', async () => {
      // Simular qpdf --check retornando erro de senha
      mockExec.mockImplementation((cmd: string, callback: (error: any, stdout: string, stderr: string) => void) => {
        const error = new Error('password required');
        (error as any).stderr = 'qpdf: encrypted file requires a password';
        callback(error, '', 'qpdf: encrypted file requires a password');
      });

      const pdfBuffer = Buffer.from('fake encrypted pdf content');
      const result = await checkPdfProtection(pdfBuffer);

      expect(result.isProtected).toBe(true);
      expect(result.needsPassword).toBe(true);
    });

    it('deve lidar com erros de verificação graciosamente', async () => {
      // Simular erro genérico
      mockExec.mockImplementation((cmd: string, callback: (error: any, stdout: string, stderr: string) => void) => {
        const error = new Error('some other error');
        (error as any).stderr = 'some other error';
        callback(error, '', 'some other error');
      });

      const pdfBuffer = Buffer.from('fake pdf content');
      const result = await checkPdfProtection(pdfBuffer);

      // Deve retornar não protegido em caso de erro genérico
      expect(result.needsPassword).toBe(false);
    });
  });

  describe('unlockPdf', () => {
    it('deve desbloquear PDF com senha correta', async () => {
      // Simular qpdf --decrypt retornando sucesso
      mockExec.mockImplementation((cmd: string, callback: (error: any, stdout: string, stderr: string) => void) => {
        callback(null, '', '');
      });

      const pdfBuffer = Buffer.from('fake encrypted pdf content');
      const result = await unlockPdf(pdfBuffer, 'correctpassword');

      expect(result.success).toBe(true);
      expect(result.unlockedBuffer).toBeDefined();
    });

    it('deve retornar erro para senha incorreta', async () => {
      // Simular qpdf --decrypt retornando erro de senha incorreta
      mockExec.mockImplementation((cmd: string, callback: (error: any, stdout: string, stderr: string) => void) => {
        const error = new Error('invalid password');
        (error as any).stderr = 'qpdf: invalid password';
        callback(error, '', 'qpdf: invalid password');
      });

      const pdfBuffer = Buffer.from('fake encrypted pdf content');
      const result = await unlockPdf(pdfBuffer, 'wrongpassword');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Senha incorreta');
    });
  });
});
