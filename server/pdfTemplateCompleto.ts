/**
 * Template HTML completo para geração de PDF do Cartão de Pré-natal
 * Replica exatamente o visual da página de impressão (CartaoPrenatalImpressao.tsx)
 * Usado pelo endpoint gestante.gerarPdfCartao para o app mobile
 */

export interface DadosPdfCompleto {
  gestante: {
    nome: string;
    idade: number | null;
    dum: string | null;
    dppDUM: string | null;
    dppUS: string | null;
    gesta: number | null;
    para: number | null;
    abortos: number | null;
    partosNormais: number | null;
    cesareas: number | null;
    dataUltrassom: string | null;
    igUltrassomSemanas: number | null;
    igUltrassomDias: number | null;
  };
  graficos?: {
    peso?: string; // base64
    au?: string; // base64
    pa?: string; // base64
  };
  consultas: Array<{
    dataConsulta: string;
    igDUM: string | null;
    igUS: string | null;
    peso: number | null;
    pa: string | null;
    au: number | null;
    bcf: number | null;
    mf: number | null;
    conduta: string | null;
    condutaComplementacao: string | null;
    observacoes: string | null;
  }>;
  marcos: Array<{
    titulo: string;
    data: string;
    periodo: string;
  }>;
  ultrassons: Array<{
    data: string;
    ig: string;
    tipo: string;
    observacoes: string | null;
  }>;
  exames: Array<{
    nome: string;
    trimestre1?: { resultado: string; data?: string };
    trimestre2?: { resultado: string; data?: string };
    trimestre3?: { resultado: string; data?: string };
  }>;
  fatoresRisco: Array<{ tipo: string }>;
  medicamentos: Array<{ tipo: string; especificacao?: string }>;
}

/**
 * Formata data para pt-BR
 */
function formatarData(data: string | null): string {
  if (!data) return '-';
  const d = new Date(data + 'T12:00:00');
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('pt-BR');
}

/**
 * Gera HTML completo do cartão pré-natal para conversão em PDF
 */
export function gerarHTMLCartaoCompleto(dados: DadosPdfCompleto): string {
  const { gestante, consultas, marcos, ultrassons, exames, fatoresRisco, medicamentos, graficos } = dados;

  // Gerar linhas da tabela de consultas
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

  // Gerar badges de fatores de risco
  const badgesFatoresRisco = fatoresRisco.map(fator => {
    const tipoFormatado = fator.tipo.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
    return `<span class="badge badge-red">${tipoFormatado}</span>`;
  }).join('');

  // Gerar badges de medicamentos
  const tipoNomesMed: Record<string, string> = {
    aas: "AAS 100mg/dia",
    anti_hipertensivos: "Anti-hipertensivos",
    calcio: "Cálcio",
    enoxaparina: "Enoxaparina",
    insulina: "Insulina",
    levotiroxina: "Levotiroxina",
    medicamentos_inalatorios: "Medicamentos Inalatórios",
    polivitaminicos: "Polivitamínico gestacional",
    progestagenos: "Progestágenos",
    psicotropicos: "Psicotrópicos",
    outros: "Outros"
  };
  
  const badgesMedicamentos = medicamentos.map(med => {
    const nome = tipoNomesMed[med.tipo] || med.tipo;
    const especificacao = med.especificacao ? ` (${med.especificacao})` : '';
    return `<span class="badge badge-blue">${nome}${especificacao}</span>`;
  }).join('');

  // Gerar linhas da tabela de marcos
  const linhasMarcos = marcos.map(marco => `
    <tr>
      <td>${marco.titulo}</td>
      <td>${marco.periodo}</td>
      <td>${formatarData(marco.data)}</td>
    </tr>
  `).join('');

  // Gerar seção de ultrassons
  const tipoNomesUS: Record<string, string> = {
    'primeiro_ultrassom': '1º Ultrassom',
    'morfologico_1tri': 'Morfológico 1º Trimestre',
    'ultrassom_obstetrico': 'Ultrassom Obstétrico',
    'morfologico_2tri': 'Morfológico 2º Trimestre',
    'ecocardiograma_fetal': 'Ecocardiograma Fetal',
    'ultrassom_seguimento': 'Ultrassom de Seguimento',
  };

  const listaUltrassons = ultrassons.map(us => `
    <div class="ultrassom-item">
      <div class="ultrassom-header">
        <span class="ultrassom-tipo">${tipoNomesUS[us.tipo] || us.tipo}</span>
        <span class="ultrassom-data">${formatarData(us.data)}</span>
      </div>
      <div class="ultrassom-info">
        <span><strong>IG:</strong> ${us.ig || '-'}</span>
        ${us.observacoes ? `<span><strong>Obs:</strong> ${us.observacoes}</span>` : ''}
      </div>
    </div>
  `).join('');

  // Gerar seção de exames por trimestre
  const gerarExamesTrimestre = (trimestre: 1 | 2 | 3) => {
    const key = `trimestre${trimestre}` as 'trimestre1' | 'trimestre2' | 'trimestre3';
    const examesTri = exames.filter(e => e[key]?.resultado);
    if (examesTri.length === 0) return '';
    
    return `
      <div class="exame-trimestre">
        <h4>${trimestre}º Trimestre</h4>
        <div class="exame-lista">
          ${examesTri.map(e => `
            <div class="exame-item">
              <span class="exame-nome">${e.nome.replace(/_/g, ' ')}</span>
              <span class="exame-resultado">${e[key]?.resultado || '-'}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  };

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cartão de Pré-Natal - ${gestante.nome}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: white;
      padding: 24px;
      color: #1f2937;
      font-size: 12px;
      line-height: 1.4;
    }
    
    @page {
      margin: 1cm;
      size: A4;
    }
    
    .header {
      text-align: center;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 3px solid #6B4226;
    }
    
    .header h1 {
      font-size: 24px;
      font-weight: bold;
      color: #6B4226;
      margin-bottom: 4px;
    }
    
    .header .subtitle {
      font-size: 12px;
      color: #666;
    }
    
    h2 {
      font-size: 16px;
      font-weight: 600;
      color: #6B4226;
      margin-bottom: 12px;
      padding-bottom: 4px;
      border-bottom: 1px solid #e5e7eb;
    }
    
    .section {
      margin-bottom: 20px;
      page-break-inside: avoid;
    }
    
    .grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
    }
    
    .grid-2 {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }
    
    .field {
      margin-bottom: 6px;
    }
    
    .field-label {
      font-weight: 600;
      display: block;
      font-size: 10px;
      color: #666;
      margin-bottom: 2px;
    }
    
    .field-value {
      display: block;
      font-size: 12px;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10px;
      margin-top: 8px;
    }
    
    th {
      background-color: #f3f4f6;
      border: 1px solid #d1d5db;
      padding: 6px 4px;
      text-align: left;
      font-weight: 600;
      font-size: 9px;
    }
    
    td {
      border: 1px solid #d1d5db;
      padding: 5px 4px;
      font-size: 9px;
    }
    
    tr:nth-child(even) {
      background-color: #f9fafb;
    }
    
    .badges {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    
    .badge {
      padding: 3px 10px;
      border-radius: 12px;
      font-size: 10px;
      display: inline-block;
    }
    
    .badge-red {
      background-color: #fee2e2;
      color: #991b1b;
    }
    
    .badge-blue {
      background-color: #dbeafe;
      color: #1e40af;
    }
    
    .divider {
      border-top: 1px solid #e5e7eb;
      padding-top: 12px;
      margin-top: 8px;
    }
    
    .ultrassom-item {
      border: 1px solid #d1d5db;
      border-radius: 6px;
      padding: 10px;
      margin-bottom: 8px;
    }
    
    .ultrassom-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 6px;
    }
    
    .ultrassom-tipo {
      font-weight: 600;
      font-size: 11px;
    }
    
    .ultrassom-data {
      font-size: 10px;
      color: #666;
    }
    
    .ultrassom-info {
      font-size: 10px;
      display: flex;
      gap: 16px;
    }
    
    .exames-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
    }
    
    .exame-trimestre {
      border: 1px solid #d1d5db;
      border-radius: 6px;
      padding: 10px;
    }
    
    .exame-trimestre h4 {
      font-size: 11px;
      font-weight: 600;
      text-align: center;
      background-color: #f3f4f6;
      padding: 4px;
      border-radius: 4px;
      margin-bottom: 8px;
    }
    
    .exame-item {
      display: flex;
      justify-content: space-between;
      font-size: 9px;
      padding: 2px 0;
      border-bottom: 1px solid #f3f4f6;
    }
    
    .exame-nome {
      font-weight: 500;
    }
    
    .marcos-nota {
      font-size: 10px;
      color: #666;
      font-style: italic;
      margin-bottom: 8px;
    }
    
    .page-break {
      page-break-before: always;
    }
  </style>
</head>
<body>
  <!-- Cabeçalho -->
  <div class="header">
    <h1>Cartão de Pré-Natal</h1>
    <div class="subtitle">Clínica Mais Mulher</div>
  </div>

  <!-- Dados da Gestante -->
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
        <span class="field-value">${gestante.dum === 'Incerta' || gestante.dum === 'Incompatível com US' ? gestante.dum : formatarData(gestante.dum)}</span>
      </div>
      <div class="field">
        <span class="field-label">DPP pela DUM</span>
        <span class="field-value">${formatarData(gestante.dppDUM)}</span>
      </div>
      <div class="field"></div>
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
  <!-- Fatores de Risco -->
  <div class="section">
    <h2>Fatores de Risco</h2>
    <div class="badges">
      ${badgesFatoresRisco}
    </div>
  </div>
  ` : ''}

  ${medicamentos.length > 0 ? `
  <!-- Medicamentos em Uso -->
  <div class="section">
    <h2>Medicamentos em Uso</h2>
    <div class="badges">
      ${badgesMedicamentos}
    </div>
  </div>
  ` : ''}

  <!-- Gráficos de Evolução -->
  ${graficos && (graficos.peso || graficos.au || graficos.pa) ? `
  <div class="section">
    <h2>Gráficos de Evolução</h2>
    <div style="display: grid; grid-template-columns: repeat(${[graficos.peso, graficos.au, graficos.pa].filter(Boolean).length > 2 ? 2 : [graficos.peso, graficos.au, graficos.pa].filter(Boolean).length}, 1fr); gap: 16px; margin-bottom: 16px;">
      ${graficos.peso ? `<div style="text-align: center;"><img src="data:image/png;base64,${graficos.peso}" style="max-width: 100%; height: auto; border: 1px solid #e5e7eb; border-radius: 8px;" alt="Gráfico de Peso" /></div>` : ''}
      ${graficos.au ? `<div style="text-align: center;"><img src="data:image/png;base64,${graficos.au}" style="max-width: 100%; height: auto; border: 1px solid #e5e7eb; border-radius: 8px;" alt="Gráfico de AU" /></div>` : ''}
      ${graficos.pa ? `<div style="text-align: center;"><img src="data:image/png;base64,${graficos.pa}" style="max-width: 100%; height: auto; border: 1px solid #e5e7eb; border-radius: 8px;" alt="Gráfico de PA" /></div>` : ''}
    </div>
  </div>
  ` : ''}

  <!-- Histórico de Consultas -->
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
  <!-- Marcos Importantes -->
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

  ${ultrassons.length > 0 ? `
  <!-- Ultrassons -->
  <div class="section">
    <h2>Ultrassons Realizados</h2>
    ${listaUltrassons}
  </div>
  ` : ''}

  ${exames.length > 0 ? `
  <!-- Exames Laboratoriais -->
  <div class="section">
    <h2>Exames Laboratoriais</h2>
    <div class="exames-grid">
      ${gerarExamesTrimestre(1)}
      ${gerarExamesTrimestre(2)}
      ${gerarExamesTrimestre(3)}
    </div>
  </div>
  ` : ''}

  <!-- Rodapé -->
  <div style="margin-top: 24px; padding-top: 12px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 10px; color: #666;">
    <p>Documento gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
    <p>APP Gestantes - Clínica Mais Mulher</p>
  </div>
</body>
</html>
  `.trim();
}
