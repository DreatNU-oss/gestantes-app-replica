import { getDb } from './db';
import { gestantes, logsEmails } from '../drizzle/schema';
import { enviarEmail, templates } from './email';
import { eq, and, isNotNull } from 'drizzle-orm';

interface GestanteLembrete {
  id: number;
  nome: string;
  email: string | null;
  dum: string | null;
  dataUltrassom: string | null;
  igUltrassomSemanas: number | null;
  igUltrassomDias: number | null;
}

/**
 * Calcula idade gestacional atual baseado na DUM
 */
function calcularIGPorDUM(dum: Date): { semanas: number; dias: number } {
  const hoje = new Date();
  const diffMs = hoje.getTime() - dum.getTime();
  const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const semanas = Math.floor(diffDias / 7);
  const dias = diffDias % 7;
  return { semanas, dias };
}

/**
 * Calcula idade gestacional atual baseado no ultrassom
 */
function calcularIGPorUS(dataUS: Date, igUSSemanas: number, igUSDias: number): { semanas: number; dias: number } {
  const hoje = new Date();
  const diffMs = hoje.getTime() - dataUS.getTime();
  const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  const diasTotaisUS = (igUSSemanas * 7) + igUSDias;
  const diasTotaisHoje = diasTotaisUS + diffDias;
  
  const semanas = Math.floor(diasTotaisHoje / 7);
  const dias = diasTotaisHoje % 7;
  return { semanas, dias };
}

/**
 * Obtém IG atual da gestante (prioriza US, depois DUM)
 */
function obterIGAtual(gestante: GestanteLembrete): { semanas: number; dias: number } | null {
  // Prioridade 1: Ultrassom
  if (gestante.dataUltrassom && gestante.igUltrassomSemanas !== null) {
    const dataUS = typeof gestante.dataUltrassom === 'string' 
      ? new Date(gestante.dataUltrassom) 
      : gestante.dataUltrassom;
    return calcularIGPorUS(dataUS, gestante.igUltrassomSemanas, gestante.igUltrassomDias || 0);
  }
  
  // Prioridade 2: DUM
  if (gestante.dum) {
    const dum = typeof gestante.dum === 'string' ? new Date(gestante.dum) : gestante.dum;
    return calcularIGPorDUM(dum);
  }
  
  return null;
}

/**
 * Verifica se já foi enviado um lembrete específico para a gestante
 */
async function jaEnviouLembrete(gestanteId: number, tipoLembrete: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const logs = await db.select()
    .from(logsEmails)
    .where(and(
      eq(logsEmails.gestanteId, gestanteId),
      eq(logsEmails.tipoLembrete, tipoLembrete),
      eq(logsEmails.status, 'enviado')
    ));
  return logs.length > 0;
}

/**
 * Processa lembretes para todas as gestantes
 */
export async function processarLembretes(): Promise<{
  processadas: number;
  enviados: number;
  erros: number;
  detalhes: string[];
}> {
  const db = await getDb();
  if (!db) throw new Error('Banco de dados não disponível');
  const resultado = {
    processadas: 0,
    enviados: 0,
    erros: 0,
    detalhes: [] as string[],
  };
  
  try {
    // Buscar todas as gestantes com e-mail cadastrado
    const todasGestantes = await db.select()
      .from(gestantes)
      .where(isNotNull(gestantes.email)) as GestanteLembrete[];
    
    resultado.processadas = todasGestantes.length;
    resultado.detalhes.push(`📊 Processando ${todasGestantes.length} gestantes com e-mail cadastrado`);
    
    for (const gestante of todasGestantes) {
      if (!gestante.email) continue;
      
      const ig = obterIGAtual(gestante);
      if (!ig) {
        resultado.detalhes.push(`⚠️  ${gestante.nome}: Sem DUM ou US cadastrado`);
        continue;
      }
      
      const { semanas, dias } = ig;
      resultado.detalhes.push(`👤 ${gestante.nome}: ${semanas}s ${dias}d`);
      
      // Lembrete: Vacina dTpa (exatamente 27 semanas)
      if (semanas === 27 && dias === 0) {
        if (!(await jaEnviouLembrete(gestante.id, 'dtpa'))) {
          const template = templates.dtpa(gestante.nome);
          const envio = await enviarEmail({
            gestanteId: gestante.id,
            destinatario: gestante.email,
            assunto: template.assunto,
            titulo: template.titulo,
            conteudo: template.conteudo,
            tipoLembrete: 'dtpa',
          });
          
          if (envio.sucesso) {
            resultado.enviados++;
            resultado.detalhes.push(`   ✅ Enviado: Vacina dTpa`);
          } else {
            resultado.erros++;
            resultado.detalhes.push(`   ❌ Erro dTpa: ${envio.erro}`);
          }
        }
      }
      
      // Lembrete: Vacina Bronquiolite (32 semanas)
      if (semanas === 32 && dias === 0) {
        if (!(await jaEnviouLembrete(gestante.id, 'bronquiolite'))) {
          const template = templates.bronquiolite(gestante.nome, semanas);
          const envio = await enviarEmail({
            gestanteId: gestante.id,
            destinatario: gestante.email,
            assunto: template.assunto,
            titulo: template.titulo,
            conteudo: template.conteudo,
            tipoLembrete: 'bronquiolite',
          });
          
          if (envio.sucesso) {
            resultado.enviados++;
            resultado.detalhes.push(`   ✅ Enviado: Vacina Bronquiolite`);
          } else {
            resultado.erros++;
            resultado.detalhes.push(`   ❌ Erro Bronquiolite: ${envio.erro}`);
          }
        }
      }
      
      // Lembrete: Morfológico 1º Tri (10 semanas - 1 semana antes de 11-14 semanas)
      if (semanas === 10 && dias === 0) {
        if (!(await jaEnviouLembrete(gestante.id, 'morfo1tri_1sem'))) {
          const template = templates.morfo1tri(gestante.nome, semanas);
          const envio = await enviarEmail({
            gestanteId: gestante.id,
            destinatario: gestante.email,
            assunto: template.assunto,
            titulo: template.titulo,
            conteudo: template.conteudo,
            tipoLembrete: 'morfo1tri_1sem',
          });
          
          if (envio.sucesso) {
            resultado.enviados++;
            resultado.detalhes.push(`   ✅ Enviado: Morfológico 1º Tri`);
          } else {
            resultado.erros++;
            resultado.detalhes.push(`   ❌ Erro Morfo 1º Tri: ${envio.erro}`);
          }
        }
      }
      
      // Lembrete: Morfológico 2º Tri - 2 semanas antes (18 semanas)
      if (semanas === 18 && dias === 0) {
        if (!(await jaEnviouLembrete(gestante.id, 'morfo2tri_2sem'))) {
          const template = templates.morfo2tri(gestante.nome, semanas, 2);
          const envio = await enviarEmail({
            gestanteId: gestante.id,
            destinatario: gestante.email,
            assunto: template.assunto,
            titulo: template.titulo,
            conteudo: template.conteudo,
            tipoLembrete: 'morfo2tri_2sem',
          });
          
          if (envio.sucesso) {
            resultado.enviados++;
            resultado.detalhes.push(`   ✅ Enviado: Morfológico 2º Tri (2 semanas)`);
          } else {
            resultado.erros++;
            resultado.detalhes.push(`   ❌ Erro Morfo 2º Tri (2 sem): ${envio.erro}`);
          }
        }
      }
      
      // Lembrete: Morfológico 2º Tri - 1 semana antes (19 semanas)
      if (semanas === 19 && dias === 0) {
        if (!(await jaEnviouLembrete(gestante.id, 'morfo2tri_1sem'))) {
          const template = templates.morfo2tri(gestante.nome, semanas, 1);
          const envio = await enviarEmail({
            gestanteId: gestante.id,
            destinatario: gestante.email,
            assunto: template.assunto,
            titulo: template.titulo,
            conteudo: template.conteudo,
            tipoLembrete: 'morfo2tri_1sem',
          });
          
          if (envio.sucesso) {
            resultado.enviados++;
            resultado.detalhes.push(`   ✅ Enviado: Morfológico 2º Tri (1 semana)`);
          } else {
            resultado.erros++;
            resultado.detalhes.push(`   ❌ Erro Morfo 2º Tri (1 sem): ${envio.erro}`);
          }
        }
      }
    }
    
    resultado.detalhes.push(`\n📊 Resumo: ${resultado.enviados} enviados, ${resultado.erros} erros`);
    return resultado;
  } catch (error: any) {
    resultado.detalhes.push(`❌ Erro fatal: ${error.message}`);
    return resultado;
  }
}
