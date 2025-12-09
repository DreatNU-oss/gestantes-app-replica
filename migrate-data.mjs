import { drizzle } from "drizzle-orm/mysql2";
import * as schema from "./drizzle/schema.js";

const db = drizzle(process.env.DATABASE_URL);

async function migrateData() {
  console.log("🔄 Iniciando migração de dados...");

  try {
    // Seed planos de saúde
    console.log("📋 Migrando planos de saúde...");
    const planos = [
      { nome: "Particular" },
      { nome: "SUS" },
      { nome: "Unimed" },
      { nome: "Hapvida" },
      { nome: "Amil" },
      { nome: "Bradesco Saúde" },
      { nome: "SulAmérica" },
    ];

    for (const plano of planos) {
      await db.insert(schema.planosSaude).values(plano).onDuplicateKeyUpdate({ set: { nome: plano.nome } });
    }
    console.log("✅ Planos de saúde migrados!");

    // Seed médicos
    console.log("👨‍⚕️ Migrando médicos...");
    const medicos = [
      { nome: "Dr. João Silva", ordem: 1 },
      { nome: "Dra. Maria Santos", ordem: 2 },
      { nome: "Dr. Pedro Oliveira", ordem: 3 },
    ];

    for (const medico of medicos) {
      await db.insert(schema.medicos).values(medico).onDuplicateKeyUpdate({ set: { nome: medico.nome } });
    }
    console.log("✅ Médicos migrados!");

    console.log("🎉 Migração concluída com sucesso!");
    console.log("\n📊 Resumo:");
    console.log(`   - ${planos.length} planos de saúde`);
    console.log(`   - ${medicos.length} médicos`);
    console.log("\n✨ O sistema está pronto para uso!");
    
  } catch (error) {
    console.error("❌ Erro na migração:", error);
    throw error;
  }
}

migrateData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
