import { DadosCartaoPrenatal } from './pdfData';

/**
 * Formata data para pt-BR
 */
function formatarData(data: Date | string | null): string {
  if (!data) return '-';
  const dataStr = typeof data === 'string' ? data : data.toISOString().split('T')[0];
  const d = new Date(dataStr + 'T12:00:00');
  return d.toLocaleDateString('pt-BR');
}

/**
 * Calcula IG pela DUM
 */
function calcularIG(dataConsulta: Date | string, dum: string | Date | null) {
  if (!dum || dum === 'Incerta' || dum === 'Incompatível com US') return null;
  
  const dumDate = typeof dum === 'string' ? new Date(dum) : dum;
  const consultaDate = typeof dataConsulta === 'string' ? new Date(dataConsulta) : dataConsulta;
  
  if (isNaN(dumDate.getTime()) || isNaN(consultaDate.getTime())) return null;
  
  const diffMs = consultaDate.getTime() - dumDate.getTime();
  const totalDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const semanas = Math.floor(totalDias / 7);
  const dias = totalDias % 7;
  
  if (isNaN(semanas) || isNaN(dias)) return null;
  
  return { semanas, dias };
}

/**
 * Calcula IG pelo ultrassom
 */
function calcularIGPorUS(dataConsulta: Date | string, dataUltrassom: string | Date | null, igUltrassomSemanas: number | null, igUltrassomDias: number | null) {
  if (!dataUltrassom || igUltrassomSemanas === null) return null;
  
  const ultrassom = typeof dataUltrassom === 'string' ? new Date(dataUltrassom) : dataUltrassom;
  const consulta = typeof dataConsulta === 'string' ? new Date(dataConsulta) : dataConsulta;
  
  if (isNaN(ultrassom.getTime()) || isNaN(consulta.getTime())) return null;
  
  const diffMs = consulta.getTime() - ultrassom.getTime();
  const diasDesdeUS = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const totalDiasUS = (igUltrassomSemanas * 7) + (igUltrassomDias || 0) + diasDesdeUS;
  const semanas = Math.floor(totalDiasUS / 7);
  const dias = totalDiasUS % 7;
  
  if (isNaN(semanas) || isNaN(dias)) return null;
  
  return { semanas, dias };
}

/**
 * Gera HTML completo do cartão pré-natal
 */
export function gerarHTMLCartaoPrenatal(dados: DadosCartaoPrenatal): string {
  const { gestante, consultas, fatoresRisco, medicamentos } = dados;
  
  // Gerar linhas da tabela de consultas
  const linhasConsultas = consultas.map(consulta => {
    const igDUM = calcularIG(consulta.dataConsulta, gestante.dum);
    const igUS = gestante.dataUltrassom ? calcularIGPorUS(
      consulta.dataConsulta,
      gestante.dataUltrassom,
      gestante.igUltrassomSemanas,
      gestante.igUltrassomDias
    ) : null;
    
    return `
      <tr>
        <td style="border: 1px solid #d1d5db; padding: 8px;">${formatarData(consulta.dataConsulta)}</td>
        <td style="border: 1px solid #d1d5db; padding: 8px;">${igDUM ? `${igDUM.semanas}s ${igDUM.dias}d` : '-'}</td>
        <td style="border: 1px solid #d1d5db; padding: 8px;">${igUS ? `${igUS.semanas}s ${igUS.dias}d` : '-'}</td>
        <td style="border: 1px solid #d1d5db; padding: 8px;">${consulta.peso ? `${consulta.peso} kg` : '-'}</td>
        <td style="border: 1px solid #d1d5db; padding: 8px;">${consulta.pressaoArterial || '-'}</td>
        <td style="border: 1px solid #d1d5db; padding: 8px;">${consulta.alturaUterina ? `${consulta.alturaUterina} cm` : '-'}</td>
        <td style="border: 1px solid #d1d5db; padding: 8px;">${consulta.bcf ? 'Sim' : 'Não'}</td>
        <td style="border: 1px solid #d1d5db; padding: 8px;">-</td>
        <td style="border: 1px solid #d1d5db; padding: 8px;">${consulta.conduta || '-'}</td>
        <td style="border: 1px solid #d1d5db; padding: 8px;">${consulta.observacoes || '-'}</td>
      </tr>
    `;
  }).join('');
  
  // Gerar badges de fatores de risco
  const badgesFatoresRisco = fatoresRisco.map(fator => {
    const tipoFormatado = fator.tipo.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
    return `<span style="background-color: #fee2e2; color: #991b1b; padding: 4px 12px; border-radius: 9999px; font-size: 14px; display: inline-block; margin: 4px;">${tipoFormatado}</span>`;
  }).join('');
  
  // Gerar badges de medicamentos
  const badgesMedicamentos = medicamentos.map(med => {
    const nome = med.especificacao || med.tipo.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
    return `<span style="background-color: #dbeafe; color: #1e40af; padding: 4px 12px; border-radius: 9999px; font-size: 14px; display: inline-block; margin: 4px;">${nome}</span>`;
  }).join('');

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
      padding: 32px;
      color: #1f2937;
      font-size: 14px;
      line-height: 1.5;
    }
    
    @page {
      margin: 1cm;
      size: A4;
    }
    
    .header {
      text-align: center;
      margin-bottom: 32px;
    }
    
    .logo {
      height: 96px;
      margin: 0 auto 16px;
      display: block;
    }
    
    h1 {
      font-size: 24px;
      font-weight: bold;
      color: #6B4226;
      border-bottom: 2px solid #6B4226;
      padding-bottom: 8px;
    }
    
    h2 {
      font-size: 18px;
      font-weight: 600;
      color: #6B4226;
      margin-bottom: 16px;
    }
    
    .section {
      margin-bottom: 32px;
    }
    
    .grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }
    
    .field {
      margin-bottom: 8px;
    }
    
    .field-label {
      font-weight: 600;
      display: block;
      margin-bottom: 2px;
    }
    
    .field-value {
      display: block;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }
    
    th {
      background-color: #f3f4f6;
      border: 1px solid #d1d5db;
      padding: 8px;
      text-align: left;
      font-weight: 600;
    }
    
    td {
      border: 1px solid #d1d5db;
      padding: 8px;
    }
    
    .badges {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    
    .divider {
      border-top: 1px solid #e5e7eb;
      padding-top: 16px;
      margin-top: 8px;
    }
  </style>
</head>
<body>
  <!-- Logo e Título -->
  <div class="header">
    <h1>Cartão de Pré-Natal</h1>
  </div>

  <!-- Dados da Gestante -->
  <div class="section">
    <h2>Dados da Gestante</h2>
    <div class="grid">
      <div class="field">
        <span class="field-label">Nome:</span>
        <span class="field-value">${gestante.nome}</span>
      </div>
      <div class="field">
        <span class="field-label">Idade:</span>
        <span class="field-value">-</span>
      </div>
      <div class="field">
        <span class="field-label">Telefone:</span>
        <span class="field-value">${gestante.telefone || '-'}</span>
      </div>
      <div class="field">
        <span class="field-label">DUM:</span>
        <span class="field-value">${gestante.dum === 'Incerta' || gestante.dum === 'Incompatível com US' ? gestante.dum : (gestante.dum ? formatarData(gestante.dum) : '-')}</span>
      </div>
      <div class="field">
        <span class="field-label">DPP pela DUM:</span>
        <span class="field-value">-</span>
      </div>
      <div class="field">
        <span class="field-label">História Obstétrica:</span>
        <span class="field-value">G${gestante.gesta || 0}P${gestante.para || 0}A${gestante.abortos || 0}</span>
      </div>
    </div>
    
    <div class="divider">
      <div style="font-weight: 600; font-size: 16px; margin-bottom: 16px;">Dados do Ultrassom</div>
      <div class="grid">
        <div class="field">
          <span class="field-label">Data do Ultrassom:</span>
          <span class="field-value">${gestante.dataUltrassom ? formatarData(gestante.dataUltrassom) : '-'}</span>
        </div>
        <div class="field">
          <span class="field-label">IG no Ultrassom:</span>
          <span class="field-value">${gestante.igUltrassomSemanas !== null ? `${gestante.igUltrassomSemanas}s ${gestante.igUltrassomDias || 0}d` : '-'}</span>
        </div>
        <div class="field">
          <span class="field-label">DPP pelo Ultrassom:</span>
          <span class="field-value">-</span>
        </div>
      </div>
    </div>
    
    <div class="grid" style="margin-top: 16px;">
      <div class="field">
        <span class="field-label">Plano de Saúde:</span>
        <span class="field-value">-</span>
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

  <!-- Histórico de Consultas -->
  <div class="section">
    <h2>Histórico de Consultas</h2>
    <table>
      <thead>
        <tr>
          <th>Data</th>
          <th>IG DUM</th>
          <th>IG US</th>
          <th>Peso (kg)</th>
          <th>PA</th>
          <th>AU (cm)</th>
          <th>BCF</th>
          <th>MF</th>
          <th>Conduta</th>
          <th>Observações</th>
        </tr>
      </thead>
      <tbody>
        ${linhasConsultas}
      </tbody>
    </table>
  </div>
</body>
</html>
  `.trim();
}
