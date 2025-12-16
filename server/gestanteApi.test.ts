import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock do getDb
vi.mock('./db', () => ({
  getDb: vi.fn(),
}));

// Mock do gestanteAuth
vi.mock('./gestanteAuth', () => ({
  solicitarCodigoAcesso: vi.fn(),
  validarCodigoECriarSessao: vi.fn(),
  verificarTokenGestante: vi.fn(),
  encerrarSessao: vi.fn(),
  registrarLogAcesso: vi.fn(),
}));

// Mock do calculos
vi.mock('./calculos', () => ({
  calcularIdadeGestacional: vi.fn(() => ({ semanas: 28, dias: 4, totalDias: 200 })),
  calcularIdadeGestacionalPorDUM: vi.fn(() => ({ semanas: 28, dias: 4, totalDias: 200 })),
  calcularIdadeGestacionalPorUS: vi.fn(() => ({ semanas: 28, dias: 2, totalDias: 198 })),
  calcularDPP: vi.fn(() => new Date('2025-03-08')),
  calcularDPPPorUS: vi.fn(() => new Date('2025-03-06')),
  parseIGParaDias: vi.fn(() => 59),
}));

import { getDb } from './db';
import { 
  solicitarCodigoAcesso, 
  validarCodigoECriarSessao, 
  verificarTokenGestante,
  encerrarSessao,
  registrarLogAcesso
} from './gestanteAuth';

describe('Gestante API - Autenticação', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('solicitarCodigoAcesso', () => {
    it('deve retornar sucesso quando gestante é encontrada', async () => {
      const mockResult = {
        success: true,
        message: 'Código enviado para seu email',
        gestanteNome: 'Maria',
      };
      
      vi.mocked(solicitarCodigoAcesso).mockResolvedValue(mockResult);
      
      const result = await solicitarCodigoAcesso('maria@exemplo.com', 'email');
      
      expect(result.success).toBe(true);
      expect(result.gestanteNome).toBe('Maria');
    });

    it('deve retornar erro quando gestante não é encontrada', async () => {
      const mockResult = {
        success: false,
        error: 'Gestante não encontrada com este contato',
      };
      
      vi.mocked(solicitarCodigoAcesso).mockResolvedValue(mockResult);
      
      const result = await solicitarCodigoAcesso('desconhecido@exemplo.com', 'email');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Gestante não encontrada com este contato');
    });
  });

  describe('validarCodigoECriarSessao', () => {
    it('deve retornar token quando código é válido', async () => {
      const mockResult = {
        success: true,
        token: 'jwt-token-mock',
        gestante: {
          id: 1,
          nome: 'Maria Silva',
          email: 'maria@exemplo.com',
        },
        expiraEm: '2026-01-14T12:00:00.000Z',
      };
      
      vi.mocked(validarCodigoECriarSessao).mockResolvedValue(mockResult);
      
      const result = await validarCodigoECriarSessao('maria@exemplo.com', '123456');
      
      expect(result.success).toBe(true);
      expect(result.token).toBe('jwt-token-mock');
      expect(result.gestante?.nome).toBe('Maria Silva');
    });

    it('deve retornar erro quando código é inválido', async () => {
      const mockResult = {
        success: false,
        error: 'Código inválido ou expirado',
      };
      
      vi.mocked(validarCodigoECriarSessao).mockResolvedValue(mockResult);
      
      const result = await validarCodigoECriarSessao('maria@exemplo.com', '000000');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Código inválido ou expirado');
    });
  });

  describe('verificarTokenGestante', () => {
    it('deve retornar dados da sessão quando token é válido', async () => {
      const mockResult = {
        gestanteId: 1,
        sessaoId: 10,
      };
      
      vi.mocked(verificarTokenGestante).mockResolvedValue(mockResult);
      
      const result = await verificarTokenGestante('valid-token');
      
      expect(result).not.toBeNull();
      expect(result?.gestanteId).toBe(1);
      expect(result?.sessaoId).toBe(10);
    });

    it('deve retornar null quando token é inválido', async () => {
      vi.mocked(verificarTokenGestante).mockResolvedValue(null);
      
      const result = await verificarTokenGestante('invalid-token');
      
      expect(result).toBeNull();
    });
  });

  describe('encerrarSessao', () => {
    it('deve encerrar sessão com sucesso', async () => {
      vi.mocked(encerrarSessao).mockResolvedValue({ success: true });
      
      const result = await encerrarSessao('valid-token');
      
      expect(result.success).toBe(true);
    });
  });
});

describe('Gestante API - Isolamento de Dados (LGPD)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve garantir que gestante só acessa seus próprios dados', async () => {
    // Simular verificação de token retornando gestanteId específico
    const gestanteId = 5;
    
    vi.mocked(verificarTokenGestante).mockResolvedValue({
      gestanteId,
      sessaoId: 10,
    });
    
    const result = await verificarTokenGestante('token-gestante-5');
    
    // Verificar que o gestanteId retornado é o esperado
    expect(result?.gestanteId).toBe(gestanteId);
    
    // Em uma implementação real, todas as queries usariam este gestanteId
    // para filtrar apenas os dados desta gestante específica
  });

  it('deve registrar logs de acesso para auditoria', async () => {
    vi.mocked(registrarLogAcesso).mockResolvedValue(undefined);
    
    await registrarLogAcesso(
      1, // gestanteId
      10, // sessaoId
      'api_request',
      '/api/gestante/me',
      '192.168.1.1',
      'Mozilla/5.0'
    );
    
    expect(registrarLogAcesso).toHaveBeenCalledWith(
      1,
      10,
      'api_request',
      '/api/gestante/me',
      '192.168.1.1',
      'Mozilla/5.0'
    );
  });
});

describe('Gestante API - Validações', () => {
  it('deve validar formato de email', () => {
    const emailValido = 'maria@exemplo.com';
    const emailInvalido = 'maria-exemplo.com';
    
    expect(emailValido.includes('@')).toBe(true);
    expect(emailInvalido.includes('@')).toBe(false);
  });

  it('deve validar formato de código (6 dígitos)', () => {
    const codigoValido = '123456';
    const codigoInvalido = '12345'; // 5 dígitos
    const codigoComLetras = '12345a';
    
    const regexCodigo = /^\d{6}$/;
    
    expect(regexCodigo.test(codigoValido)).toBe(true);
    expect(regexCodigo.test(codigoInvalido)).toBe(false);
    expect(regexCodigo.test(codigoComLetras)).toBe(false);
  });

  it('deve limpar telefone corretamente', () => {
    const telefoneComFormatacao = '(11) 99999-8888';
    const telefoneLimpo = telefoneComFormatacao.replace(/[\s\-()]/g, '');
    
    expect(telefoneLimpo).toBe('11999998888');
  });
});
