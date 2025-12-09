import { drizzle } from 'drizzle-orm/mysql2';
import { gestantes } from './drizzle/schema.js';

const db = drizzle(process.env.DATABASE_URL);
const result = await db.select().from(gestantes);
console.log('Total de gestantes no banco:', result.length);

// Verificar se há gestantes sem userId
const semUserId = result.filter(g => !g.userId);
console.log('Gestantes sem userId:', semUserId.length);

// Verificar distribuição por userId
const porUserId = {};
result.forEach(g => {
  const uid = g.userId || 'null';
  porUserId[uid] = (porUserId[uid] || 0) + 1;
});
console.log('Distribuição por userId:', porUserId);

process.exit(0);
