import { db } from './server/db.ts';
import { gestantes, ultrassons } from './drizzle/schema.ts';
import { eq } from 'drizzle-orm';

const gestante = await db.select().from(gestantes).where(eq(gestantes.nome, 'Débora Gouvea Rocha de Jesus')).limit(1);
console.log('Gestante:', gestante[0]?.id, gestante[0]?.nome);

if (gestante[0]) {
  const usData = await db.select().from(ultrassons).where(eq(ultrassons.gestanteId, gestante[0].id));
  console.log('\n📊 Ultrassons encontrados:', usData.length);
  
  if (usData.length === 0) {
    console.log('❌ Nenhum ultrassom cadastrado para esta gestante!');
  } else {
    usData.forEach(us => {
      console.log('\n---');
      console.log('ID:', us.id);
      console.log('Tipo:', us.tipoUltrassom);
      console.log('Data:', us.dataExame);
      console.log('IG:', us.idadeGestacional);
      console.log('Dados:', us.dados ? JSON.stringify(JSON.parse(us.dados), null, 2) : 'null');
    });
  }
}

process.exit(0);
