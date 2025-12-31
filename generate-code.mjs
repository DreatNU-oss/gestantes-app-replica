import { db } from './server/db.ts';
import { codigosAcessoGestante } from './drizzle/schema.ts';

const email = 'dreatnu@yahoo.com';
const codigo = Math.floor(100000 + Math.random() * 900000).toString();
const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

// Buscar gestante por email
const gestantes = await db.query.gestantes.findMany({
  where: (gestantes, { eq }) => eq(gestantes.email, email)
});

if (gestantes.length === 0) {
  console.log('ERRO: Nenhuma gestante encontrada com o email', email);
  process.exit(1);
}

const gestante = gestantes[0];

// Inserir código
await db.insert(codigosAcessoGestante).values({
  gestanteId: gestante.id,
  codigo: codigo,
  expiresAt: expiresAt,
  usado: 0
});

console.log('✅ Código gerado com sucesso!');
console.log('Email:', email);
console.log('Gestante:', gestante.nome);
console.log('Código:', codigo);
console.log('Válido até:', expiresAt.toLocaleString('pt-BR'));

process.exit(0);
