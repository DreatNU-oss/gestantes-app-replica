import { getDb } from "../server/db";
import { gestantes, whatsappHistorico } from "../drizzle/schema";
import { eq, like, or, desc } from "drizzle-orm";

async function main() {
  const db = await getDb();
  if (!db) { console.error('DB not available'); process.exit(1); }
  
  // 1. Check the phone numbers of the 5 patients that had correct numbers but failed
  const failedNames = ['Raissa', 'Bruna do Carmo', 'Giovanna', 'Marcela', 'Tatiane'];
  
  console.log("=== NÚMEROS DAS PACIENTES QUE FALHARAM (números corretos) ===");
  for (const name of failedNames) {
    const results = await db.select({
      id: gestantes.id,
      nome: gestantes.nome,
      telefone: gestantes.telefone,
      clinicaId: gestantes.clinicaId,
    }).from(gestantes).where(like(gestantes.nome, `%${name}%`));
    
    for (const r of results) {
      console.log(`  ${r.nome} | Tel: "${r.telefone}" | Len: ${r.telefone?.length} | Clinica: ${r.clinicaId}`);
      // Check if starts with 55
      if (r.telefone) {
        const digits = r.telefone.replace(/\D/g, '');
        console.log(`    Digits only: "${digits}" | Starts with 55: ${digits.startsWith('55')} | Len: ${digits.length}`);
      }
    }
  }
  
  // 2. Check the corrected patients
  const correctedNames = ['Erica', 'Makisleide', 'Sophy', 'Maria da Glória'];
  
  console.log("\n=== NÚMEROS DAS PACIENTES CORRIGIDAS ===");
  for (const name of correctedNames) {
    const results = await db.select({
      id: gestantes.id,
      nome: gestantes.nome,
      telefone: gestantes.telefone,
      clinicaId: gestantes.clinicaId,
    }).from(gestantes).where(like(gestantes.nome, `%${name}%`));
    
    for (const r of results) {
      console.log(`  ${r.nome} | Tel: "${r.telefone}" | Len: ${r.telefone?.length} | Clinica: ${r.clinicaId}`);
      if (r.telefone) {
        const digits = r.telefone.replace(/\D/g, '');
        console.log(`    Digits only: "${digits}" | Starts with 55: ${digits.startsWith('55')} | Len: ${digits.length}`);
      }
    }
  }
  
  // 3. Check the error logs in whatsappHistorico for these patients
  console.log("\n=== HISTÓRICO DE ERROS ===");
  const errorHistory = await db.select({
    id: whatsappHistorico.id,
    gestanteNome: whatsappHistorico.gestanteNome,
    telefone: whatsappHistorico.telefone,
    status: whatsappHistorico.status,
    erro: whatsappHistorico.erro,
    enviadoEm: whatsappHistorico.enviadoEm,
  }).from(whatsappHistorico)
    .where(eq(whatsappHistorico.status, 'erro'))
    .orderBy(desc(whatsappHistorico.enviadoEm));
  
  for (const h of errorHistory) {
    console.log(`  ${h.gestanteNome} | Tel: "${h.telefone}" | Erro: ${h.erro} | Data: ${h.enviadoEm}`);
  }
  
  // 4. Check a successful send to compare the format
  console.log("\n=== ENVIOS COM SUCESSO (para comparar formato) ===");
  const successHistory = await db.select({
    gestanteNome: whatsappHistorico.gestanteNome,
    telefone: whatsappHistorico.telefone,
    status: whatsappHistorico.status,
    enviadoEm: whatsappHistorico.enviadoEm,
  }).from(whatsappHistorico)
    .where(eq(whatsappHistorico.status, 'enviado'))
    .orderBy(desc(whatsappHistorico.enviadoEm))
    .limit(10);
  
  for (const h of successHistory) {
    console.log(`  ${h.gestanteNome} | Tel: "${h.telefone}" | Data: ${h.enviadoEm}`);
  }
  
  process.exit(0);
}

main().catch(console.error);
