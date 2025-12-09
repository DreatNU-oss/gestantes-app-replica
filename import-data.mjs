import { drizzle } from "drizzle-orm/mysql2";
import { sql } from "drizzle-orm";
import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

// Função para ler CSV
function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n").filter((line) => line.trim());
  const headers = lines[0].split(",");

  return lines.slice(1).map((line) => {
    const values = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        values.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const obj = {};
    headers.forEach((header, index) => {
      const value = values[index] || "";
      obj[header.trim()] = value === "" ? null : value;
    });
    return obj;
  });
}

// Função para converter data
function parseDate(dateStr) {
  if (!dateStr || dateStr === "null") return null;
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
}

async function importData() {
  console.log("🚀 Iniciando migração de dados...\n");

  try {
    // 1. Importar médicos
    console.log("📋 Importando médicos...");
    const medicosData = parseCSV("/home/ubuntu/upload/medicos_20251209_175601.csv");
    for (const medico of medicosData) {
      await connection.execute(`
        INSERT INTO medicos (id, nome, ordem, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          nome = VALUES(nome),
          ordem = VALUES(ordem),
          updatedAt = VALUES(updatedAt)
      `, [
        parseInt(medico.id),
        medico.nome,
        medico.ordem ? parseInt(medico.ordem) : null,
        parseDate(medico.createdAt) || new Date(),
        parseDate(medico.updatedAt) || new Date(),
      ]);
    }
    console.log(`✅ ${medicosData.length} médicos importados\n`);

    // 2. Importar gestantes
    console.log("👶 Importando gestantes...");
    const gestantesData = parseCSV("/home/ubuntu/upload/gestantes_20251209_175552.csv");
    for (const g of gestantesData) {
      await connection.execute(`
        INSERT INTO gestantes (
          id, userId, nome, telefone, email, dataNascimento, dum, dataUltrassom,
          tipoPartoDesejado, gesta, para, partosNormais, cesareas,
          abortos, medicoId, planoSaudeId, igUltrassomSemanas, igUltrassomDias,
          carteirinhaUnimed, createdAt, updatedAt
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          nome = VALUES(nome),
          telefone = VALUES(telefone),
          email = VALUES(email),
          dataNascimento = VALUES(dataNascimento),
          dum = VALUES(dum),
          dataUltrassom = VALUES(dataUltrassom),
          tipoPartoDesejado = VALUES(tipoPartoDesejado),
          gesta = VALUES(gesta),
          para = VALUES(para),
          partosNormais = VALUES(partosNormais),
          cesareas = VALUES(cesareas),
          abortos = VALUES(abortos),
          medicoId = VALUES(medicoId),
          planoSaudeId = VALUES(planoSaudeId),
          igUltrassomSemanas = VALUES(igUltrassomSemanas),
          igUltrassomDias = VALUES(igUltrassomDias),
          carteirinhaUnimed = VALUES(carteirinhaUnimed),
          updatedAt = VALUES(updatedAt)
      `, [
        parseInt(g.id),
        parseInt(g.userId),
        g.nome || null,
        g.telefone || null,
        g.email || null,
        parseDate(g.dataNascimento),
        parseDate(g.dum),
        parseDate(g.dataUltrassom),
        g.tipoPartoDesejado || "a_definir",
        g.gesta ? parseInt(g.gesta) : null,
        g.para ? parseInt(g.para) : null,
        g.partosNormais ? parseInt(g.partosNormais) : null,
        g.cesareas ? parseInt(g.cesareas) : null,
        g.abortos ? parseInt(g.abortos) : null,
        g.medicoId ? parseInt(g.medicoId) : null,
        g.planoSaudeId ? parseInt(g.planoSaudeId) : null,
        g.igUltrassomSemanas ? parseInt(g.igUltrassomSemanas) : null,
        g.igUltrassomDias ? parseInt(g.igUltrassomDias) : null,
        g.carteirinhaUnimed || g.carteirinhaPlano || null,
        parseDate(g.createdAt) || new Date(),
        parseDate(g.updatedAt) || new Date(),
      ]);
    }
    console.log(`✅ ${gestantesData.length} gestantes importadas\n`);

    console.log("\n⚠️  Consultas e exames não foram importados pois requerem adaptação de schema.\n");
    console.log("Os dados principais (gestantes e médicos) foram migrados com sucesso!\n");

    console.log("🎉 Migração concluída com sucesso!");
  } catch (error) {
    console.error("❌ Erro na migração:", error);
    throw error;
  }
}

importData();
