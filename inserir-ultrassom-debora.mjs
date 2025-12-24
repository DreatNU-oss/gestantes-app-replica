import { db } from './server/db.ts';
import { gestantes, ultrassons } from './drizzle/schema.ts';
import { eq } from 'drizzle-orm';

// Buscar Débora
const gestante = await db.select().from(gestantes).where(eq(gestantes.nome, 'Débora Gouvea Rocha de Jesus')).limit(1);

if (!gestante[0]) {
  console.log('❌ Gestante não encontrada!');
  process.exit(1);
}

console.log('✅ Gestante encontrada:', gestante[0].id, gestante[0].nome);

// Inserir ultrassom
const dados = {
  ccn: '12mm',
  bcf: '150 bpm',
  sacoVitelino: 'Presente',
  hematoma: 'Sim',
  corpoLuteo: 'Presente',
  dpp: '2025-12-31'
};

const result = await db.insert(ultrassons).values({
  gestanteId: gestante[0].id,
  tipoUltrassom: 'primeiro_ultrassom',
  dataExame: '2025-05-20',
  idadeGestacional: '7s 6d',
  dados: JSON.stringify(dados),
});

console.log('✅ Ultrassom inserido com sucesso!');
console.log('ID:', result[0].insertId);

// Buscar ultrassons da gestante para confirmar
const ultrassonsGestante = await db.select().from(ultrassons).where(eq(ultrassons.gestanteId, gestante[0].id));
console.log('\n📊 Total de ultrassons da gestante:', ultrassonsGestante.length);
ultrassonsGestante.forEach(us => {
  console.log('- Tipo:', us.tipoUltrassom, '| Data:', us.dataExame, '| IG:', us.idadeGestacional);
});

process.exit(0);
