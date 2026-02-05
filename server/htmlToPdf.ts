import { jsPDF } from 'jspdf';
import sharp from 'sharp';

/**
 * Interface para os dados do PDF
 */
interface DadosPdf {
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
    peso?: string;
    au?: string;
    pa?: string;
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
 * Converte SVG para PNG base64 usando sharp
 */
async function svgToPngBase64(svg: string): Promise<string> {
  try {
    const pngBuffer = await sharp(Buffer.from(svg))
      .png()
      .toBuffer();
    return `data:image/png;base64,${pngBuffer.toString('base64')}`;
  } catch (error) {
    console.error('Erro ao converter SVG para PNG:', error);
    return '';
  }
}

/**
 * Gera PDF do Cartão de Pré-natal usando jsPDF
 */
export async function gerarPdfComJsPDF(dados: DadosPdf): Promise<Buffer> {
  console.log('[htmlToPdf] Iniciando geração de PDF com jsPDF...');
  
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - 2 * margin;
  let y = margin;

  // Cores
  const corPrimaria = [139, 69, 19]; // Marrom
  const corTexto = [51, 51, 51];
  const corCinza = [128, 128, 128];

  // Função auxiliar para adicionar nova página se necessário
  const checkNewPage = (height: number = 20) => {
    if (y + height > pageHeight - margin) {
      doc.addPage();
      y = margin;
      return true;
    }
    return false;
  };

  // Função para desenhar título de seção
  const drawSectionTitle = (title: string) => {
    checkNewPage(15);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(corPrimaria[0], corPrimaria[1], corPrimaria[2]);
    doc.text(title, margin, y);
    y += 8;
    doc.setTextColor(corTexto[0], corTexto[1], corTexto[2]);
    doc.setFont('helvetica', 'normal');
  };

  // Função para desenhar linha de dados
  const drawDataLine = (label: string, value: string) => {
    checkNewPage(8);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(label + ':', margin, y);
    doc.setFont('helvetica', 'normal');
    const labelWidth = doc.getTextWidth(label + ': ');
    doc.text(value || '-', margin + labelWidth, y);
    y += 6;
  };

  // ===== CABEÇALHO =====
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(corPrimaria[0], corPrimaria[1], corPrimaria[2]);
  doc.text('Cartão de Pré-Natal', pageWidth / 2, y, { align: 'center' });
  y += 6;
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(corCinza[0], corCinza[1], corCinza[2]);
  doc.text('Clínica Mais Mulher', pageWidth / 2, y, { align: 'center' });
  y += 10;

  // ===== DADOS DA GESTANTE =====
  drawSectionTitle('Dados da Gestante');
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(corTexto[0], corTexto[1], corTexto[2]);
  doc.text(dados.gestante.nome, margin, y);
  y += 6;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  // Idade
  if (dados.gestante.idade) {
    drawDataLine('Idade', `${dados.gestante.idade} anos`);
  }
  
  // DUM e DPP
  if (dados.gestante.dum) {
    drawDataLine('DUM', formatarData(dados.gestante.dum));
  }
  if (dados.gestante.dppDUM) {
    drawDataLine('DPP (DUM)', formatarData(dados.gestante.dppDUM));
  }
  if (dados.gestante.dppUS) {
    drawDataLine('DPP (US)', formatarData(dados.gestante.dppUS));
  }
  
  // Ultrassom
  if (dados.gestante.dataUltrassom) {
    drawDataLine('Data US', formatarData(dados.gestante.dataUltrassom));
    if (dados.gestante.igUltrassomSemanas !== null) {
      drawDataLine('IG no US', `${dados.gestante.igUltrassomSemanas}s ${dados.gestante.igUltrassomDias || 0}d`);
    }
  }
  
  // História obstétrica
  const go = `G${dados.gestante.gesta || 0}P${dados.gestante.para || 0}A${dados.gestante.abortos || 0}`;
  drawDataLine('GO', go);
  
  if (dados.gestante.cesareas) {
    drawDataLine('Cesáreas', `${dados.gestante.cesareas}`);
  }
  
  y += 5;

  // ===== FATORES DE RISCO =====
  if (dados.fatoresRisco.length > 0) {
    drawSectionTitle('Fatores de Risco');
    dados.fatoresRisco.forEach(f => {
      checkNewPage(6);
      doc.setFontSize(10);
      doc.text(`• ${f.tipo}`, margin + 2, y);
      y += 5;
    });
    y += 3;
  }

  // ===== MEDICAMENTOS =====
  if (dados.medicamentos.length > 0) {
    drawSectionTitle('Medicamentos');
    dados.medicamentos.forEach(m => {
      checkNewPage(6);
      doc.setFontSize(10);
      const texto = m.especificacao ? `${m.tipo}: ${m.especificacao}` : m.tipo;
      doc.text(`• ${texto}`, margin + 2, y);
      y += 5;
    });
    y += 3;
  }

  // ===== GRÁFICOS =====
  if (dados.graficos) {
    const graficosParaAdicionar: { titulo: string; svg: string }[] = [];
    
    if (dados.graficos.peso) {
      graficosParaAdicionar.push({ titulo: 'Evolução do Peso', svg: dados.graficos.peso });
    }
    if (dados.graficos.au) {
      graficosParaAdicionar.push({ titulo: 'Evolução da Altura Uterina', svg: dados.graficos.au });
    }
    if (dados.graficos.pa) {
      graficosParaAdicionar.push({ titulo: 'Evolução da Pressão Arterial', svg: dados.graficos.pa });
    }

    for (const grafico of graficosParaAdicionar) {
      checkNewPage(70);
      
      drawSectionTitle(grafico.titulo);
      
      try {
        const pngBase64 = await svgToPngBase64(grafico.svg);
        if (pngBase64) {
          const imgWidth = contentWidth * 0.9;
          const imgHeight = 50;
          doc.addImage(pngBase64, 'PNG', margin + (contentWidth - imgWidth) / 2, y, imgWidth, imgHeight);
          y += imgHeight + 5;
        }
      } catch (error) {
        console.error('Erro ao adicionar gráfico:', error);
      }
    }
  }

  // ===== HISTÓRICO DE CONSULTAS =====
  if (dados.consultas.length > 0) {
    checkNewPage(40);
    drawSectionTitle('Histórico de Consultas');
    
    // Cabeçalho da tabela
    const colWidths = [22, 18, 18, 18, 18, 18, 68];
    const headers = ['Data', 'IG', 'Peso', 'PA', 'AU', 'BCF', 'Conduta'];
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setFillColor(245, 245, 245);
    doc.rect(margin, y - 3, contentWidth, 7, 'F');
    
    let x = margin;
    headers.forEach((header, i) => {
      doc.text(header, x + 1, y);
      x += colWidths[i];
    });
    y += 6;
    
    // Linhas da tabela
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    
    dados.consultas.forEach((consulta, index) => {
      if (checkNewPage(8)) {
        // Redesenhar cabeçalho na nova página
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setFillColor(245, 245, 245);
        doc.rect(margin, y - 3, contentWidth, 7, 'F');
        let x = margin;
        headers.forEach((header, i) => {
          doc.text(header, x + 1, y);
          x += colWidths[i];
        });
        y += 6;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
      }
      
      // Alternar cor de fundo
      if (index % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(margin, y - 3, contentWidth, 6, 'F');
      }
      
      const pesoFormatado = consulta.peso ? `${(consulta.peso / 1000).toFixed(1)}kg` : '-';
      const auFormatado = consulta.au === -1 ? 'NP' : (consulta.au ? `${(consulta.au / 10).toFixed(0)}cm` : '-');
      const bcfFormatado = consulta.bcf === 1 ? '+' : consulta.bcf === 0 ? '-' : '-';
      
      let condutaFormatada = '-';
      if (consulta.conduta) {
        try {
          const condutas = JSON.parse(consulta.conduta);
          if (Array.isArray(condutas) && condutas.length > 0) {
            condutaFormatada = condutas.slice(0, 2).join(', ');
            if (condutas.length > 2) condutaFormatada += '...';
          }
        } catch {
          condutaFormatada = consulta.conduta.substring(0, 30);
        }
      }
      
      const rowData = [
        formatarData(consulta.dataConsulta),
        consulta.igDUM || '-',
        pesoFormatado,
        consulta.pa || '-',
        auFormatado,
        bcfFormatado,
        condutaFormatada,
      ];
      
      x = margin;
      rowData.forEach((cell, i) => {
        const maxWidth = colWidths[i] - 2;
        let text = cell;
        if (doc.getTextWidth(text) > maxWidth) {
          while (doc.getTextWidth(text + '...') > maxWidth && text.length > 0) {
            text = text.slice(0, -1);
          }
          text += '...';
        }
        doc.text(text, x + 1, y);
        x += colWidths[i];
      });
      y += 5;
    });
    y += 5;
  }

  // ===== MARCOS IMPORTANTES =====
  if (dados.marcos.length > 0) {
    checkNewPage(30);
    drawSectionTitle('Marcos Importantes');
    
    dados.marcos.forEach(marco => {
      checkNewPage(8);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(`${marco.titulo}`, margin + 2, y);
      doc.setFont('helvetica', 'normal');
      doc.text(` - ${formatarData(marco.data)} (${marco.periodo})`, margin + 2 + doc.getTextWidth(marco.titulo), y);
      y += 5;
    });
    y += 3;
  }

  // ===== ULTRASSONS =====
  if (dados.ultrassons.length > 0) {
    checkNewPage(30);
    drawSectionTitle('Ultrassons Realizados');
    
    dados.ultrassons.forEach(us => {
      checkNewPage(10);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(`${us.tipo}`, margin + 2, y);
      doc.setFont('helvetica', 'normal');
      doc.text(` - ${formatarData(us.data)} (${us.ig})`, margin + 2 + doc.getTextWidth(us.tipo), y);
      y += 4;
      if (us.observacoes) {
        doc.setFontSize(8);
        doc.setTextColor(corCinza[0], corCinza[1], corCinza[2]);
        doc.text(`   ${us.observacoes}`, margin + 2, y);
        doc.setTextColor(corTexto[0], corTexto[1], corTexto[2]);
        y += 4;
      }
    });
    y += 3;
  }

  // ===== EXAMES LABORATORIAIS =====
  if (dados.exames.length > 0) {
    checkNewPage(40);
    drawSectionTitle('Exames Laboratoriais');
    
    // Cabeçalho
    const exameColWidths = [50, 40, 40, 40];
    const exameHeaders = ['Exame', '1º Tri', '2º Tri', '3º Tri'];
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setFillColor(245, 245, 245);
    doc.rect(margin, y - 3, contentWidth, 7, 'F');
    
    let x = margin;
    exameHeaders.forEach((header, i) => {
      doc.text(header, x + 1, y);
      x += exameColWidths[i];
    });
    y += 6;
    
    // Linhas
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    
    dados.exames.forEach((exame, index) => {
      if (checkNewPage(8)) {
        // Redesenhar cabeçalho
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setFillColor(245, 245, 245);
        doc.rect(margin, y - 3, contentWidth, 7, 'F');
        let x = margin;
        exameHeaders.forEach((header, i) => {
          doc.text(header, x + 1, y);
          x += exameColWidths[i];
        });
        y += 6;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
      }
      
      if (index % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(margin, y - 3, contentWidth, 6, 'F');
      }
      
      const rowData = [
        exame.nome,
        exame.trimestre1?.resultado || '-',
        exame.trimestre2?.resultado || '-',
        exame.trimestre3?.resultado || '-',
      ];
      
      x = margin;
      rowData.forEach((cell, i) => {
        const maxWidth = exameColWidths[i] - 2;
        let text = cell;
        if (doc.getTextWidth(text) > maxWidth) {
          while (doc.getTextWidth(text + '...') > maxWidth && text.length > 0) {
            text = text.slice(0, -1);
          }
          text += '...';
        }
        doc.text(text, x + 1, y);
        x += exameColWidths[i];
      });
      y += 5;
    });
  }

  // ===== RODAPÉ =====
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(corCinza[0], corCinza[1], corCinza[2]);
    doc.text(
      `Gerado em ${new Date().toLocaleDateString('pt-BR')} - Página ${i} de ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  console.log('[htmlToPdf] PDF gerado com sucesso via jsPDF');
  
  // Retornar como Buffer
  const pdfOutput = doc.output('arraybuffer');
  return Buffer.from(pdfOutput);
}

/**
 * Função de compatibilidade - mantém a interface antiga mas usa jsPDF internamente
 * @deprecated Use gerarPdfComJsPDF diretamente
 */
export async function htmlToPdf(html: string): Promise<Buffer> {
  // Esta função não é mais usada, mas mantemos para compatibilidade
  // O código que chama htmlToPdf deve ser atualizado para usar gerarPdfComJsPDF
  throw new Error('htmlToPdf está deprecado. Use gerarPdfComJsPDF diretamente.');
}
