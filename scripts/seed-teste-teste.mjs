/**
 * Script para criar gestante TESTE TESTE com dados completos simulados
 * 
 * Dados:
 * - Nome: TESTE TESTE
 * - Email: dreatnu@yahoo.com
 * - Idade: 36 anos
 * - Alto Risco: Idade avançada
 * - Medicamentos: Polivitamínico e AAS
 * - IG: 36 semanas (DUM e USG)
 * - Consultas: 1 por mês desde 7 semanas (~8 consultas)
 * - Peso inicial: 56kg, Altura: 165cm
 * - Ultrassons: 1º US, Morfo 1º tri, Morfo 2º tri, USG Doppler
 * - Exames laboratoriais: Todos os trimestres com valores normais
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

async function main() {
  console.log('Conectando ao banco de dados...');
  
  const connection = await mysql.createConnection(DATABASE_URL);
  
  try {
    // Calcular datas
    // Hoje: 21/01/2026
    // 36 semanas = 252 dias
    // DUM = hoje - 252 dias = 14/05/2025
    const hoje = new Date('2026-01-21');
    const dum = new Date(hoje);
    dum.setDate(dum.getDate() - 252); // 36 semanas atrás
    const dumStr = dum.toISOString().split('T')[0]; // 2025-05-14
    
    // Data do 1º ultrassom (7 semanas = 49 dias após DUM)
    const data1US = new Date(dum);
    data1US.setDate(data1US.getDate() + 49);
    const data1USStr = data1US.toISOString().split('T')[0];
    
    // Data de nascimento (36 anos atrás)
    const dataNascimento = new Date('1989-06-15');
    const dataNascimentoStr = dataNascimento.toISOString().split('T')[0];
    
    // Buscar userId do admin (ou primeiro usuário)
    const [users] = await connection.execute('SELECT id FROM users LIMIT 1');
    const userId = users[0]?.id || 1;
    
    console.log('Criando gestante TESTE TESTE...');
    
    // Inserir gestante
    const [gestanteResult] = await connection.execute(`
      INSERT INTO gestantes (
        userId, nome, email, telefone, dataNascimento,
        dum, igUltrassomSemanas, igUltrassomDias, dataUltrassom,
        altura, pesoInicial, gesta, para, partosNormais, cesareas, abortos,
        tipoPartoDesejado, observacoes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      userId,
      'TESTE TESTE',
      'dreatnu@yahoo.com',
      '(11) 99999-9999',
      dataNascimentoStr,
      dumStr,
      7, // IG do 1º US: 7 semanas
      0, // 0 dias
      data1USStr,
      165, // altura em cm
      56000, // peso em gramas (56kg)
      1, // gesta
      0, // para
      0, // partosNormais
      0, // cesareas
      0, // abortos
      'a_definir',
      'Gestante de teste com dados simulados para demonstração'
    ]);
    
    const gestanteId = gestanteResult.insertId;
    console.log(`Gestante criada com ID: ${gestanteId}`);
    
    // Inserir fator de risco: Idade avançada
    await connection.execute(`
      INSERT INTO fatoresRisco (gestanteId, tipo, descricao, ativo)
      VALUES (?, ?, ?, ?)
    `, [gestanteId, 'idade_avancada', 'Gestante com 36 anos - Alto risco por idade', 1]);
    console.log('Fator de risco adicionado: Idade avançada');
    
    // Inserir medicamentos: Polivitamínico e AAS
    await connection.execute(`
      INSERT INTO medicamentosGestacao (gestanteId, tipo, especificacao, ativo)
      VALUES (?, ?, ?, ?)
    `, [gestanteId, 'polivitaminicos', 'Polivitamínico gestacional', 1]);
    
    await connection.execute(`
      INSERT INTO medicamentosGestacao (gestanteId, tipo, especificacao, ativo)
      VALUES (?, ?, ?, ?)
    `, [gestanteId, 'aas', 'AAS 100mg/dia', 1]);
    console.log('Medicamentos adicionados: Polivitamínico e AAS');
    
    // Inserir consultas mensais desde 7 semanas
    // Consultas: 7s, 11s, 15s, 19s, 23s, 27s, 31s, 35s (8 consultas)
    const consultas = [
      { semanas: 7, dias: 0, peso: 56000, pa: '110/70', au: 0 },
      { semanas: 11, dias: 0, peso: 56500, pa: '110/70', au: 0 },
      { semanas: 15, dias: 0, peso: 57200, pa: '115/75', au: 12 },
      { semanas: 19, dias: 0, peso: 58000, pa: '110/70', au: 16 },
      { semanas: 23, dias: 0, peso: 59000, pa: '115/70', au: 20 },
      { semanas: 27, dias: 0, peso: 60200, pa: '110/75', au: 24 },
      { semanas: 31, dias: 0, peso: 61500, pa: '115/75', au: 28 },
      { semanas: 35, dias: 0, peso: 63000, pa: '120/80', au: 32 }
    ];
    
    for (const c of consultas) {
      const dataConsulta = new Date(dum);
      dataConsulta.setDate(dataConsulta.getDate() + (c.semanas * 7) + c.dias);
      const dataConsultaStr = dataConsulta.toISOString().split('T')[0];
      
      await connection.execute(`
        INSERT INTO consultasPrenatal (
          gestanteId, dataConsulta, igSemanas, igDias,
          igDumSemanas, igDumDias, igUltrassomSemanas, igUltrassomDias,
          peso, pressaoArterial, alturaUterina, bcf, mf, observacoes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        gestanteId,
        dataConsultaStr,
        c.semanas,
        c.dias,
        c.semanas,
        c.dias,
        c.semanas,
        c.dias,
        c.peso,
        c.pa,
        c.au > 0 ? c.au * 10 : null, // AU em mm (cm * 10)
        c.semanas >= 12 ? 140 + Math.floor(Math.random() * 20) : null, // BCF entre 140-160
        c.semanas >= 20 ? 1 : 0, // MF presente após 20 semanas
        `Consulta de rotina - ${c.semanas} semanas`
      ]);
    }
    console.log('8 consultas pré-natais adicionadas');
    
    // Inserir ultrassons
    // 1º Ultrassom (7 semanas)
    await connection.execute(`
      INSERT INTO ultrassons (gestanteId, tipoUltrassom, dataExame, idadeGestacional, dados)
      VALUES (?, ?, ?, ?, ?)
    `, [
      gestanteId,
      'primeiro_ultrassom',
      data1USStr,
      '7s 0d',
      JSON.stringify({
        ccn: '10mm',
        bcf: '145 bpm',
        sacoVitelino: 'Presente',
        hematoma: 'Não',
        corpoLuteo: 'Presente',
        dpp: calcularDPP(dum)
      })
    ]);
    
    // Morfológico 1º trimestre (12 semanas)
    const dataMorfo1 = new Date(dum);
    dataMorfo1.setDate(dataMorfo1.getDate() + 84); // 12 semanas
    await connection.execute(`
      INSERT INTO ultrassons (gestanteId, tipoUltrassom, dataExame, idadeGestacional, dados)
      VALUES (?, ?, ?, ?, ?)
    `, [
      gestanteId,
      'morfologico_1tri',
      dataMorfo1.toISOString().split('T')[0],
      '12s 0d',
      JSON.stringify({
        tn: '1.2mm',
        ductoVenoso: 'Normal',
        ossoNasal: 'Normal',
        ipsUterinas: '1.2 / 1.3',
        malformacoes: 'Não',
        coloUterino: '38mm',
        riscoPreEclampsia: 'Baixo risco'
      })
    ]);
    
    // Morfológico 2º trimestre (22 semanas)
    const dataMorfo2 = new Date(dum);
    dataMorfo2.setDate(dataMorfo2.getDate() + 154); // 22 semanas
    await connection.execute(`
      INSERT INTO ultrassons (gestanteId, tipoUltrassom, dataExame, idadeGestacional, dados)
      VALUES (?, ?, ?, ?, ?)
    `, [
      gestanteId,
      'morfologico_2tri',
      dataMorfo2.toISOString().split('T')[0],
      '22s 0d',
      JSON.stringify({
        biometria: 'DBP: 52mm, CC: 195mm, CA: 175mm, CF: 38mm',
        pesoEstimado: '480g',
        placenta: 'Anterior',
        grauPlacenta: 'I',
        distanciaOCI: '4cm',
        coloUterino: '35mm',
        morfologiaFetal: 'Crânio, face, coluna, tórax, coração, abdome e membros sem alterações',
        dopplers: 'AU: IP 1.0, ACM: IP 1.8',
        sexoFetal: 'Feminino',
        observacoes: 'Exame sem alterações morfológicas'
      })
    ]);
    
    // USG com Doppler (32 semanas)
    const dataDoppler = new Date(dum);
    dataDoppler.setDate(dataDoppler.getDate() + 224); // 32 semanas
    await connection.execute(`
      INSERT INTO ultrassons (gestanteId, tipoUltrassom, dataExame, idadeGestacional, dados)
      VALUES (?, ?, ?, ?, ?)
    `, [
      gestanteId,
      'ultrassom_seguimento',
      dataDoppler.toISOString().split('T')[0],
      '32s 0d',
      JSON.stringify({
        pesoEstimado: '1850g',
        percentil: 'P50',
        liquidoAmniotico: 'Normal',
        placenta: 'Anterior',
        grauPlacenta: 'II',
        distanciaOCI: '5cm',
        movimentosFetais: 'Presentes',
        apresentacao: 'Cefálica',
        dopplers: 'AU: IP 0.9, ACM: IP 1.7, DV: IP 0.5',
        observacoes: 'Crescimento fetal adequado, Doppler normal'
      })
    ]);
    console.log('4 ultrassons adicionados');
    
    // Inserir exames laboratoriais - 1º Trimestre
    const exames1Tri = [
      { nome: 'hemograma', resultado: 'Hb: 12.5 g/dL, Ht: 38%, Plaquetas: 250.000' },
      { nome: 'tipoSanguineo', resultado: 'A+' },
      { nome: 'glicemiaJejum', resultado: '85 mg/dL' },
      { nome: 'tsh', resultado: '2.1 mUI/L' },
      { nome: 'hiv', resultado: 'Não reagente' },
      { nome: 'vdrl', resultado: 'Não reagente' },
      { nome: 'hepatiteB', resultado: 'Não reagente' },
      { nome: 'hepatiteC', resultado: 'Não reagente' },
      { nome: 'toxoplasmose', resultado: 'IgG reagente / IgM não reagente' },
      { nome: 'rubeola', resultado: 'IgG reagente / IgM não reagente' },
      { nome: 'citomegalovirus', resultado: 'IgG reagente / IgM não reagente' },
      { nome: 'eas', resultado: 'Normal' },
      { nome: 'urocultura', resultado: 'Negativa' }
    ];
    
    const dataExame1Tri = new Date(dum);
    dataExame1Tri.setDate(dataExame1Tri.getDate() + 56); // 8 semanas
    
    for (const exame of exames1Tri) {
      await connection.execute(`
        INSERT INTO resultadosExames (gestanteId, nomeExame, trimestre, resultado, dataExame)
        VALUES (?, ?, ?, ?, ?)
      `, [gestanteId, exame.nome, 1, exame.resultado, dataExame1Tri.toISOString().split('T')[0]]);
    }
    console.log('Exames do 1º trimestre adicionados');
    
    // Inserir exames laboratoriais - 2º Trimestre
    const exames2Tri = [
      { nome: 'hemograma', resultado: 'Hb: 11.8 g/dL, Ht: 36%, Plaquetas: 240.000' },
      { nome: 'glicemiaJejum', resultado: '82 mg/dL' },
      { nome: 'totg', resultado: 'Jejum: 80, 1h: 140, 2h: 110 mg/dL' },
      { nome: 'toxoplasmose', resultado: 'IgG reagente / IgM não reagente' },
      { nome: 'eas', resultado: 'Normal' },
      { nome: 'urocultura', resultado: 'Negativa' }
    ];
    
    const dataExame2Tri = new Date(dum);
    dataExame2Tri.setDate(dataExame2Tri.getDate() + 168); // 24 semanas
    
    for (const exame of exames2Tri) {
      await connection.execute(`
        INSERT INTO resultadosExames (gestanteId, nomeExame, trimestre, resultado, dataExame)
        VALUES (?, ?, ?, ?, ?)
      `, [gestanteId, exame.nome, 2, exame.resultado, dataExame2Tri.toISOString().split('T')[0]]);
    }
    console.log('Exames do 2º trimestre adicionados');
    
    // Inserir exames laboratoriais - 3º Trimestre
    const exames3Tri = [
      { nome: 'hemograma', resultado: 'Hb: 11.5 g/dL, Ht: 35%, Plaquetas: 235.000' },
      { nome: 'hiv', resultado: 'Não reagente' },
      { nome: 'vdrl', resultado: 'Não reagente' },
      { nome: 'hepatiteB', resultado: 'Não reagente' },
      { nome: 'toxoplasmose', resultado: 'IgG reagente / IgM não reagente' },
      { nome: 'streptococcusB', resultado: 'Negativo' },
      { nome: 'eas', resultado: 'Normal' },
      { nome: 'urocultura', resultado: 'Negativa' }
    ];
    
    const dataExame3Tri = new Date(dum);
    dataExame3Tri.setDate(dataExame3Tri.getDate() + 238); // 34 semanas
    
    for (const exame of exames3Tri) {
      await connection.execute(`
        INSERT INTO resultadosExames (gestanteId, nomeExame, trimestre, resultado, dataExame)
        VALUES (?, ?, ?, ?, ?)
      `, [gestanteId, exame.nome, 3, exame.resultado, dataExame3Tri.toISOString().split('T')[0]]);
    }
    console.log('Exames do 3º trimestre adicionados');
    
    console.log('\\n✅ Gestante TESTE TESTE criada com sucesso!');
    console.log(`   ID: ${gestanteId}`);
    console.log(`   DUM: ${dumStr}`);
    console.log(`   Data 1º US: ${data1USStr}`);
    console.log(`   IG atual: 36 semanas`);
    
  } catch (error) {
    console.error('Erro ao criar gestante:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

function calcularDPP(dum) {
  const dpp = new Date(dum);
  dpp.setDate(dpp.getDate() + 280); // 40 semanas
  return dpp.toISOString().split('T')[0];
}

main().catch(console.error);
