import { Router, Request, Response, NextFunction } from 'express';
import { getDb } from './db';
import { 
  gestantes, 
  consultasPrenatal, 
  examesLaboratoriais, 
  ultrassons,
  logsAcessoGestante
} from '../drizzle/schema';
import { eq, desc } from 'drizzle-orm';
import { 
  solicitarCodigoAcesso, 
  validarCodigoECriarSessao, 
  verificarTokenGestante,
  encerrarSessao,
  registrarLogAcesso
} from './gestanteAuth';
import { 
  calcularIdadeGestacional, 
  calcularIdadeGestacionalPorDUM,
  calcularIdadeGestacionalPorUS,
  calcularDPP, 
  calcularDPPPorUS,
  parseIGParaDias
} from './calculos';

const router = Router();

// Middleware de autenticação para gestantes
interface GestanteRequest extends Request {
  gestante?: {
    gestanteId: number;
    sessaoId: number;
  };
}

async function authMiddleware(req: GestanteRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }
  
  const token = authHeader.substring(7);
  const gestante = await verificarTokenGestante(token);
  
  if (!gestante) {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
  
  req.gestante = gestante;
  
  // Registrar log de acesso
  await registrarLogAcesso(
    gestante.gestanteId,
    gestante.sessaoId,
    'api_request',
    req.path,
    req.ip,
    req.headers['user-agent']
  );
  
  next();
}

// ==================== AUTENTICAÇÃO ====================

// POST /api/gestante/auth/solicitar-codigo
router.post('/auth/solicitar-codigo', async (req: Request, res: Response) => {
  try {
    const { contato, tipo = 'email' } = req.body;
    
    if (!contato) {
      return res.status(400).json({ error: 'Contato (email ou telefone) é obrigatório' });
    }
    
    const resultado = await solicitarCodigoAcesso(contato, tipo);
    
    if (!resultado.success) {
      return res.status(400).json({ error: resultado.error });
    }
    
    return res.json(resultado);
  } catch (error) {
    console.error('Erro ao solicitar código:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/gestante/auth/validar
router.post('/auth/validar', async (req: Request, res: Response) => {
  try {
    const { contato, codigo, dispositivo } = req.body;
    
    if (!contato || !codigo) {
      return res.status(400).json({ error: 'Contato e código são obrigatórios' });
    }
    
    const resultado = await validarCodigoECriarSessao(
      contato, 
      codigo, 
      dispositivo,
      req.ip
    );
    
    if (!resultado.success) {
      return res.status(400).json({ error: resultado.error });
    }
    
    return res.json(resultado);
  } catch (error) {
    console.error('Erro ao validar código:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/gestante/auth/logout
router.post('/auth/logout', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      await encerrarSessao(token);
    }
    
    return res.json({ success: true });
  } catch (error) {
    console.error('Erro ao fazer logout:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ==================== DADOS DA GESTANTE ====================

// GET /api/gestante/me - Dados da gestante logada
router.get('/me', authMiddleware, async (req: GestanteRequest, res: Response) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: 'Erro de conexão' });
    
    const gestante = await db.select()
      .from(gestantes)
      .where(eq(gestantes.id, req.gestante!.gestanteId))
      .limit(1);
    
    if (!gestante[0]) {
      return res.status(404).json({ error: 'Gestante não encontrada' });
    }
    
    const g = gestante[0];
    
    // Montar string de IG do ultrassom
    const igUltrassomStr = g.igUltrassomSemanas !== null && g.igUltrassomDias !== null
      ? `${g.igUltrassomSemanas}s${g.igUltrassomDias}d`
      : null;
    
    // Calcular idade gestacional e DPP
    const igDUM = g.dum ? calcularIdadeGestacional(g.dum) : null;
    const igUS = g.dataUltrassom && igUltrassomStr 
      ? calcularIdadeGestacional(g.dataUltrassom, igUltrassomStr)
      : null;
    const dppDUM = g.dum ? calcularDPP(g.dum) : null;
    const dppUS = g.dataUltrassom && igUltrassomStr 
      ? calcularDPPPorUS(g.dataUltrassom, igUltrassomStr)
      : null;
    
    // Retornar apenas dados relevantes (sem dados sensíveis)
    return res.json({
      id: g.id,
      nome: g.nome,
      dataNascimento: g.dataNascimento,
      telefone: g.telefone,
      email: g.email,
      dum: g.dum,
      dataUltrassom: g.dataUltrassom,
      igUltrassomSemanas: g.igUltrassomSemanas,
      igUltrassomDias: g.igUltrassomDias,
      tipoPartoDesejado: g.tipoPartoDesejado,
      gesta: g.gesta,
      para: g.para,
      cesareas: g.cesareas,
      abortos: g.abortos,
      altura: g.altura,
      pesoInicial: g.pesoInicial,
      calculado: {
        igDUM,
        igUS,
        dppDUM,
        dppUS,
      }
    });
  } catch (error) {
    console.error('Erro ao buscar dados da gestante:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/gestante/marcos - Marcos importantes
router.get('/marcos', authMiddleware, async (req: GestanteRequest, res: Response) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: 'Erro de conexão' });
    
    const gestante = await db.select()
      .from(gestantes)
      .where(eq(gestantes.id, req.gestante!.gestanteId))
      .limit(1);
    
    if (!gestante[0]) {
      return res.status(404).json({ error: 'Gestante não encontrada' });
    }
    
    const g = gestante[0];
    
    // Montar string de IG do ultrassom
    const igUltrassomStr = g.igUltrassomSemanas !== null && g.igUltrassomDias !== null
      ? `${g.igUltrassomSemanas}s${g.igUltrassomDias}d`
      : null;
    
    // Calcular DPP (preferência pelo US)
    let dpp: Date | null = null;
    if (g.dataUltrassom && igUltrassomStr) {
      dpp = calcularDPPPorUS(g.dataUltrassom, igUltrassomStr);
    } else if (g.dum) {
      dpp = calcularDPP(g.dum);
    }
    
    if (!dpp) {
      return res.json({ marcos: [], mensagem: 'DPP não calculada' });
    }
    
    // Calcular data de concepção (DPP - 266 dias)
    const concepcao = new Date(dpp);
    concepcao.setDate(concepcao.getDate() - 266);
    
    // Calcular marcos
    const marcos = [
      {
        nome: 'Concepção',
        data: concepcao.toISOString().split('T')[0],
        semana: 0,
        descricao: 'Data estimada da concepção',
      },
      {
        nome: 'Morfológico 1º Trimestre',
        dataInicio: calcularDataPorSemana(dpp, 11).toISOString().split('T')[0],
        dataFim: calcularDataPorSemana(dpp, 14).toISOString().split('T')[0],
        semana: '11-14',
        descricao: 'Ultrassom morfológico do primeiro trimestre',
      },
      {
        nome: '13 Semanas',
        data: calcularDataPorSemana(dpp, 13).toISOString().split('T')[0],
        semana: 13,
        descricao: 'Fim do primeiro trimestre',
      },
      {
        nome: 'Morfológico 2º Trimestre',
        dataInicio: calcularDataPorSemana(dpp, 20).toISOString().split('T')[0],
        dataFim: calcularDataPorSemana(dpp, 24).toISOString().split('T')[0],
        semana: '20-24',
        descricao: 'Ultrassom morfológico do segundo trimestre',
      },
      {
        nome: 'Vacina dTpa',
        data: calcularDataPorSemana(dpp, 27).toISOString().split('T')[0],
        semana: 27,
        descricao: 'Vacina contra difteria, tétano e coqueluche',
      },
      {
        nome: 'Vacina Bronquiolite',
        dataInicio: calcularDataPorSemana(dpp, 32).toISOString().split('T')[0],
        dataFim: calcularDataPorSemana(dpp, 36).toISOString().split('T')[0],
        semana: '32-36',
        descricao: 'Vacina contra bronquiolite (VSR)',
      },
      {
        nome: 'Termo Precoce',
        data: calcularDataPorSemana(dpp, 37).toISOString().split('T')[0],
        semana: 37,
        descricao: 'Início do termo precoce',
      },
      {
        nome: 'Termo Completo',
        data: calcularDataPorSemana(dpp, 39).toISOString().split('T')[0],
        semana: 39,
        descricao: 'Início do termo completo',
      },
      {
        nome: 'DPP (40 semanas)',
        data: dpp.toISOString().split('T')[0],
        semana: 40,
        descricao: 'Data Provável do Parto',
      },
    ];
    
    return res.json({ marcos, dpp: dpp.toISOString().split('T')[0] });
  } catch (error) {
    console.error('Erro ao buscar marcos:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/gestante/consultas - Consultas pré-natais
router.get('/consultas', authMiddleware, async (req: GestanteRequest, res: Response) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: 'Erro de conexão' });
    
    const consultas = await db.select()
      .from(consultasPrenatal)
      .where(eq(consultasPrenatal.gestanteId, req.gestante!.gestanteId))
      .orderBy(desc(consultasPrenatal.dataConsulta));
    
    return res.json({ consultas });
  } catch (error) {
    console.error('Erro ao buscar consultas:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/gestante/exames - Exames laboratoriais
router.get('/exames', authMiddleware, async (req: GestanteRequest, res: Response) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: 'Erro de conexão' });
    
    const exames = await db.select()
      .from(examesLaboratoriais)
      .where(eq(examesLaboratoriais.gestanteId, req.gestante!.gestanteId))
      .orderBy(desc(examesLaboratoriais.createdAt));
    
    // Agrupar por tipo de exame
    const examesAgrupados: Record<string, any> = {};
    for (const exame of exames) {
      if (!examesAgrupados[exame.tipoExame]) {
        examesAgrupados[exame.tipoExame] = {
          nome: exame.tipoExame,
          resultados: [],
        };
      }
      examesAgrupados[exame.tipoExame].resultados.push({
        data: exame.dataExame,
        resultado: exame.resultado,
        igSemanas: exame.igSemanas,
        igDias: exame.igDias,
      });
    }
    
    return res.json({ exames: Object.values(examesAgrupados) });
  } catch (error) {
    console.error('Erro ao buscar exames:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/gestante/ultrassons - Ultrassons
router.get('/ultrassons', authMiddleware, async (req: GestanteRequest, res: Response) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: 'Erro de conexão' });
    
    const uss = await db.select()
      .from(ultrassons)
      .where(eq(ultrassons.gestanteId, req.gestante!.gestanteId))
      .orderBy(desc(ultrassons.dataExame));
    
    return res.json({ ultrassons: uss });
  } catch (error) {
    console.error('Erro ao buscar ultrassons:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/gestante/peso - Dados para curva de peso
router.get('/peso', authMiddleware, async (req: GestanteRequest, res: Response) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: 'Erro de conexão' });
    
    // Buscar dados da gestante
    const gestante = await db.select()
      .from(gestantes)
      .where(eq(gestantes.id, req.gestante!.gestanteId))
      .limit(1);
    
    if (!gestante[0]) {
      return res.status(404).json({ error: 'Gestante não encontrada' });
    }
    
    const g = gestante[0];
    
    // Buscar consultas com peso
    const consultas = await db.select()
      .from(consultasPrenatal)
      .where(eq(consultasPrenatal.gestanteId, req.gestante!.gestanteId))
      .orderBy(consultasPrenatal.dataConsulta);
    
    // Calcular IMC pré-gestacional
    let imcPreGestacional: number | null = null;
    let categoriaIMC: string | null = null;
    
    if (g.altura && g.pesoInicial) {
      const alturaM = g.altura / 100;
      imcPreGestacional = g.pesoInicial / (alturaM * alturaM);
      
      if (imcPreGestacional < 18.5) {
        categoriaIMC = 'Baixo Peso';
      } else if (imcPreGestacional < 25) {
        categoriaIMC = 'Peso Adequado';
      } else if (imcPreGestacional < 30) {
        categoriaIMC = 'Sobrepeso';
      } else {
        categoriaIMC = 'Obesidade';
      }
    }
    
    // Preparar dados de peso das consultas
    const dadosPeso = consultas
      .filter(c => c.peso)
      .map(c => {
        // Calcular IG na data da consulta
        let ig: { semanas: number; dias: number } | null = null;
        const igStr = g.igUltrassomSemanas && g.igUltrassomDias !== null 
          ? `${g.igUltrassomSemanas}s${g.igUltrassomDias}d` 
          : null;
        if (g.dataUltrassom && igStr) {
          ig = calcularIdadeGestacional(g.dataUltrassom, igStr, c.dataConsulta);
        } else if (g.dum) {
          ig = calcularIdadeGestacional(g.dum, undefined, c.dataConsulta);
        }
        
        return {
          data: c.dataConsulta,
          peso: c.peso,
          igSemanas: ig ? ig.semanas + (ig.dias / 7) : null,
        };
      });
    
    // Calcular ganho de peso ideal baseado no IMC
    const ganhoIdeal = calcularGanhoIdeal(imcPreGestacional, g.pesoInicial);
    
    return res.json({
      pesoInicial: g.pesoInicial,
      altura: g.altura,
      imcPreGestacional,
      categoriaIMC,
      dadosPeso,
      ganhoIdeal,
    });
  } catch (error) {
    console.error('Erro ao buscar dados de peso:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Função auxiliar para calcular data por semana gestacional
function calcularDataPorSemana(dpp: Date, semana: number): Date {
  const data = new Date(dpp);
  data.setDate(data.getDate() - (40 - semana) * 7);
  return data;
}

// Função auxiliar para calcular ganho de peso ideal
function calcularGanhoIdeal(imc: number | null, pesoInicial: number | null) {
  if (!imc || !pesoInicial) return null;
  
  // Ganho total recomendado por categoria de IMC
  let ganhoMin: number, ganhoMax: number;
  
  if (imc < 18.5) {
    ganhoMin = 12.5;
    ganhoMax = 18;
  } else if (imc < 25) {
    ganhoMin = 11.5;
    ganhoMax = 16;
  } else if (imc < 30) {
    ganhoMin = 7;
    ganhoMax = 11.5;
  } else {
    ganhoMin = 5;
    ganhoMax = 9;
  }
  
  // Gerar curva de referência (peso por semana)
  const curva = [];
  for (let semana = 0; semana <= 40; semana++) {
    // Ganho de peso é mais lento no 1º trimestre
    let fator: number;
    if (semana <= 13) {
      fator = semana / 40 * 0.5; // 50% do ganho proporcional
    } else {
      fator = 0.125 + (semana - 13) / 27 * 0.875; // 87.5% restante
    }
    
    curva.push({
      semana,
      pesoMin: pesoInicial + ganhoMin * fator,
      pesoMax: pesoInicial + ganhoMax * fator,
      pesoIdeal: pesoInicial + ((ganhoMin + ganhoMax) / 2) * fator,
    });
  }
  
  return {
    ganhoTotalMin: ganhoMin,
    ganhoTotalMax: ganhoMax,
    curva,
  };
}

export default router;
