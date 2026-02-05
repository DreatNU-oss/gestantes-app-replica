import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

// Dados de teste simulando a gestante TESTE TESTE
const dadosTeste = {
  gestante: {
    nome: "TESTE TESTE",
    idade: 30,
    dum: "2025-05-15",
    dppDUM: "2026-02-19",
    dppUS: "2026-02-17",
    gesta: 2,
    para: 1,
    abortos: 0,
    partosNormais: 1,
    cesareas: 0,
    dataUltrassom: "2025-06-20",
    igUltrassomSemanas: 8,
    igUltrassomDias: 3,
  },
  consultas: [
    {
      dataConsulta: "2025-06-25",
      igDUM: "6s2d",
      igUS: "8s3d",
      peso: 65000,
      pa: "120/80",
      au: 0,
      bcf: 1,
      mf: 0,
      conduta: '["Acompanhamento Rotina"]',
      condutaComplementacao: "Orientações gerais",
      observacoes: null,
    },
    {
      dataConsulta: "2025-07-25",
      igDUM: "10s2d",
      igUS: "12s3d",
      peso: 66500,
      pa: "110/70",
      au: 120,
      bcf: 1,
      mf: 1,
      conduta: '["Acompanhamento Rotina"]',
      condutaComplementacao: null,
      observacoes: "Gestação evoluindo bem",
    },
  ],
  marcos: [
    { titulo: "1º Ultrassom", data: "2025-06-20", periodo: "6-9s" },
    { titulo: "Morfológico 1º Tri", data: "2025-08-01", periodo: "11-14s" },
    { titulo: "Morfológico 2º Tri", data: "2025-10-10", periodo: "20-24s" },
    { titulo: "TOTG 75g", data: "2025-11-07", periodo: "24-28s" },
    { titulo: "Vacina dTpa", data: "2025-11-28", periodo: "27-36s" },
    { titulo: "Termo de Gestação", data: "2026-01-30", periodo: "37-42s" },
  ],
  ultrassons: [
    { data: "2025-06-20", ig: "8s3d", tipo: "primeiro_ultrassom", observacoes: "CCN: 15mm" },
    { data: "2025-08-05", ig: "14s1d", tipo: "morfologico_1tri", observacoes: "TN: 1.2mm" },
  ],
  exames: [
    { nome: "hemoglobina", trimestre1: { resultado: "12.5 g/dL", data: "2025-06-25" } },
    { nome: "glicemia_jejum", trimestre1: { resultado: "85 mg/dL", data: "2025-06-25" }, trimestre2: { resultado: "88 mg/dL", data: "2025-10-15" } },
    { nome: "tipo_sanguineo", trimestre1: { resultado: "A+", data: "2025-06-25" } },
  ],
  fatoresRisco: [
    { tipo: "idade_materna_avancada" },
  ],
  medicamentos: [
    { tipo: "polivitaminicos", especificacao: null },
    { tipo: "aas", especificacao: "100mg/dia" },
  ],
};

// Função para formatar data
function formatarData(data) {
  if (!data) return '-';
  const d = new Date(data + 'T12:00:00');
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('pt-BR');
}

// Gerar HTML (simplificado do pdfTemplateCompleto.ts)
function gerarHTML(dados) {
  const { gestante, consultas, marcos, ultrassons, exames, fatoresRisco, medicamentos } = dados;

  const linhasConsultas = consultas.map(consulta => {
    const condutaFormatada = (() => {
      if (!consulta.conduta) return '-';
      try {
        const condutas = JSON.parse(consulta.conduta);
        if (Array.isArray(condutas) && condutas.length === 0) return '-';
        if (Array.isArray(condutas)) return condutas.join(', ');
        return consulta.conduta;
      } catch {
        return consulta.conduta;
      }
    })();

    const pesoFormatado = consulta.peso ? (consulta.peso / 1000).toFixed(1) : '-';
    const auFormatado = consulta.au === -1 ? 'Não palpável' : (consulta.au ? `${(consulta.au / 10).toFixed(0)} cm` : '-');
    const bcfFormatado = consulta.bcf === 1 ? 'Positivo' : consulta.bcf === 0 ? 'Não audível' : '-';
    const mfFormatado = consulta.mf === 1 ? 'Sim' : '-';

    return `
      <tr>
        <td>${formatarData(consulta.dataConsulta)}</td>
        <td>${consulta.igDUM || '-'}</td>
        <td>${consulta.igUS || '-'}</td>
        <td>${pesoFormatado}</td>
        <td>${consulta.pa || '-'}</td>
        <td>${auFormatado}</td>
        <td>${bcfFormatado}</td>
        <td>${mfFormatado}</td>
        <td>${condutaFormatada}</td>
        <td>${consulta.observacoes || '-'}</td>
      </tr>
    `;
  }).join('');

  const badgesFatoresRisco = fatoresRisco.map(fator => {
    const tipoFormatado = fator.tipo.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    return `<span class="badge badge-red">${tipoFormatado}</span>`;
  }).join('');

  const tipoNomesMed = {
    aas: "AAS 100mg/dia",
    polivitaminicos: "Polivitamínico gestacional",
  };
  
  const badgesMedicamentos = medicamentos.map(med => {
    const nome = tipoNomesMed[med.tipo] || med.tipo;
    const especificacao = med.especificacao ? ` (${med.especificacao})` : '';
    return `<span class="badge badge-blue">${nome}${especificacao}</span>`;
  }).join('');

  const linhasMarcos = marcos.map(marco => `
    <tr>
      <td>${marco.titulo}</td>
      <td>${marco.periodo}</td>
      <td>${formatarData(marco.data)}</td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Cartão de Pré-Natal - ${gestante.nome}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; padding: 24px; color: #1f2937; font-size: 12px; line-height: 1.4; }
    @page { margin: 1cm; size: A4; }
    .header { text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 3px solid #6B4226; }
    .header h1 { font-size: 24px; font-weight: bold; color: #6B4226; margin-bottom: 4px; }
    .header .subtitle { font-size: 12px; color: #666; }
    h2 { font-size: 16px; font-weight: 600; color: #6B4226; margin-bottom: 12px; padding-bottom: 4px; border-bottom: 1px solid #e5e7eb; }
    .section { margin-bottom: 20px; page-break-inside: avoid; }
    .grid { display: flex; flex-wrap: wrap; gap: 12px; }
    .field { flex: 1; min-width: 150px; margin-bottom: 6px; }
    .field-label { font-weight: 600; display: block; font-size: 10px; color: #666; margin-bottom: 2px; }
    .field-value { display: block; font-size: 12px; }
    table { width: 100%; border-collapse: collapse; font-size: 10px; margin-top: 8px; }
    th { background-color: #f3f4f6; border: 1px solid #d1d5db; padding: 6px 4px; text-align: left; font-weight: 600; font-size: 9px; }
    td { border: 1px solid #d1d5db; padding: 5px 4px; font-size: 9px; }
    tr:nth-child(even) { background-color: #f9fafb; }
    .badges { display: flex; flex-wrap: wrap; gap: 6px; }
    .badge { padding: 3px 10px; border-radius: 12px; font-size: 10px; display: inline-block; }
    .badge-red { background-color: #fee2e2; color: #991b1b; }
    .badge-blue { background-color: #dbeafe; color: #1e40af; }
    .divider { border-top: 1px solid #e5e7eb; padding-top: 12px; margin-top: 8px; }
    .marcos-nota { font-size: 10px; color: #666; font-style: italic; margin-bottom: 8px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Cartão de Pré-Natal</h1>
    <div class="subtitle">Clínica Mais Mulher</div>
  </div>

  <div class="section">
    <h2>Dados da Gestante</h2>
    <div class="grid">
      <div class="field">
        <span class="field-label">Nome Completo</span>
        <span class="field-value">${gestante.nome}</span>
      </div>
      <div class="field">
        <span class="field-label">Idade</span>
        <span class="field-value">${gestante.idade ? `${gestante.idade} anos` : '-'}</span>
      </div>
      <div class="field">
        <span class="field-label">História Obstétrica</span>
        <span class="field-value">G${gestante.gesta || 0}P${gestante.para || 0}A${gestante.abortos || 0}</span>
      </div>
      <div class="field">
        <span class="field-label">DUM</span>
        <span class="field-value">${formatarData(gestante.dum)}</span>
      </div>
      <div class="field">
        <span class="field-label">DPP pela DUM</span>
        <span class="field-value">${formatarData(gestante.dppDUM)}</span>
      </div>
    </div>
    
    <div class="divider">
      <div style="font-weight: 600; font-size: 13px; margin-bottom: 10px;">Dados do Primeiro Ultrassom</div>
      <div class="grid">
        <div class="field">
          <span class="field-label">Data do 1º Ultrassom</span>
          <span class="field-value">${formatarData(gestante.dataUltrassom)}</span>
        </div>
        <div class="field">
          <span class="field-label">IG no 1º Ultrassom</span>
          <span class="field-value">${gestante.igUltrassomSemanas !== null ? `${gestante.igUltrassomSemanas}s ${gestante.igUltrassomDias || 0}d` : '-'}</span>
        </div>
        <div class="field">
          <span class="field-label">DPP pelo 1º Ultrassom</span>
          <span class="field-value">${formatarData(gestante.dppUS)}</span>
        </div>
      </div>
    </div>
  </div>

  ${fatoresRisco.length > 0 ? `
  <div class="section">
    <h2>Fatores de Risco</h2>
    <div class="badges">${badgesFatoresRisco}</div>
  </div>
  ` : ''}

  ${medicamentos.length > 0 ? `
  <div class="section">
    <h2>Medicamentos em Uso</h2>
    <div class="badges">${badgesMedicamentos}</div>
  </div>
  ` : ''}

  <div class="section">
    <h2>Histórico de Consultas</h2>
    <table>
      <thead>
        <tr>
          <th>Data</th>
          <th>IG DUM</th>
          <th>IG US</th>
          <th>Peso</th>
          <th>PA</th>
          <th>AU</th>
          <th>BCF</th>
          <th>MF</th>
          <th>Conduta</th>
          <th>Obs</th>
        </tr>
      </thead>
      <tbody>
        ${linhasConsultas || '<tr><td colspan="10" style="text-align: center;">Nenhuma consulta registrada</td></tr>'}
      </tbody>
    </table>
  </div>

  ${marcos.length > 0 ? `
  <div class="section">
    <h2>Marcos Importantes</h2>
    <p class="marcos-nota">Datas estimadas baseadas no ${gestante.dataUltrassom ? '1º Ultrassom' : 'DUM'}</p>
    <table>
      <thead>
        <tr>
          <th>Marco</th>
          <th>Período Ideal</th>
          <th>Data Estimada</th>
        </tr>
      </thead>
      <tbody>
        ${linhasMarcos}
      </tbody>
    </table>
  </div>
  ` : ''}

  <div style="margin-top: 24px; padding-top: 12px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 10px; color: #666;">
    <p>Documento gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
    <p>APP Gestantes - Clínica Mais Mulher</p>
  </div>
</body>
</html>
  `.trim();
}

async function main() {
  console.log("Gerando HTML...");
  const html = gerarHTML(dadosTeste);
  
  const htmlPath = '/tmp/cartao-teste.html';
  const pdfPath = '/home/ubuntu/cartao-teste-weasyprint.pdf';
  
  await fs.promises.writeFile(htmlPath, html, 'utf-8');
  console.log("HTML salvo em:", htmlPath);
  
  console.log("Convertendo para PDF com WeasyPrint...");
  await execAsync(`weasyprint "${htmlPath}" "${pdfPath}"`);
  
  const stats = await fs.promises.stat(pdfPath);
  console.log("PDF gerado com sucesso!");
  console.log("Caminho:", pdfPath);
  console.log("Tamanho:", (stats.size / 1024).toFixed(2), "KB");
}

main().catch(console.error);
