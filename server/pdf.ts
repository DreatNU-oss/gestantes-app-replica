import PDFDocument from 'pdfkit';
import { writeFileSync } from 'fs';
import path from 'path';
import fs from 'fs';
import { buscarDadosCartaoPrenatal } from './pdfData';
import { gerarGraficoAU, gerarGraficoPA, gerarGraficoPeso } from './pdfCharts';

/**
 * Formata data para pt-BR
 */
function formatarData(data: Date | string | null): string {
  if (!data) return '-';
  const dataStr = typeof data === 'string' ? data.split('T')[0] : data.toISOString().split('T')[0];
  const d = new Date(dataStr + 'T12:00:00');
  return d.toLocaleDateString('pt-BR');
}

/**
 * Calcula IG pela DUM
 */
function calcularIG(dataConsulta: Date | string, dum: string | Date | null) {
  if (!dum || dum === 'Incerta' || dum === 'Incompatível com US') return null;
  
  const dumStr = typeof dum === 'string' ? dum.split('T')[0] : dum.toISOString().split('T')[0];
  const consultaStr = typeof dataConsulta === 'string' ? dataConsulta.split('T')[0] : dataConsulta.toISOString().split('T')[0];
  
  const dumDate = new Date(dumStr + 'T12:00:00');
  const consultaDate = new Date(consultaStr + 'T12:00:00');
  
  if (isNaN(dumDate.getTime()) || isNaN(consultaDate.getTime())) return null;
  
  const diffMs = consultaDate.getTime() - dumDate.getTime();
  const totalDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const semanas = Math.floor(totalDias / 7);
  const dias = totalDias % 7;
  
  if (isNaN(semanas) || isNaN(dias) || semanas < 0) return null;
  
  return { semanas, dias };
}

/**
 * Calcula IG pelo ultrassom
 */
function calcularIGPorUS(dataConsulta: Date | string, dataUltrassom: string | Date | null, igUltrassomSemanas: number | null, igUltrassomDias: number | null) {
  if (!dataUltrassom || igUltrassomSemanas === null) return null;
  
  const ultrassomStr = typeof dataUltrassom === 'string' ? dataUltrassom.split('T')[0] : dataUltrassom.toISOString().split('T')[0];
  const consultaStr = typeof dataConsulta === 'string' ? dataConsulta.split('T')[0] : dataConsulta.toISOString().split('T')[0];
  
  const ultrassom = new Date(ultrassomStr + 'T12:00:00');
  const consulta = new Date(consultaStr + 'T12:00:00');
  
  if (isNaN(ultrassom.getTime()) || isNaN(consulta.getTime())) return null;
  
  const diffMs = consulta.getTime() - ultrassom.getTime();
  const diasDesdeUS = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const totalDiasUS = (igUltrassomSemanas * 7) + (igUltrassomDias || 0) + diasDesdeUS;
  const semanas = Math.floor(totalDiasUS / 7);
  const dias = totalDiasUS % 7;
  
  if (isNaN(semanas) || isNaN(dias) || semanas < 0) return null;
  
  return { semanas, dias };
}

/**
 * Gera PDF do Cartão de Pré-natal usando PDFKit (sem dependência de Chrome/Puppeteer)
 */
export async function gerarPDFCartaoPrenatal(gestanteId: number): Promise<Buffer> {
  try {
    console.log('[PDF] Buscando dados da gestante:', gestanteId);
    
    // Buscar todos os dados necessários
    const dados = await buscarDadosCartaoPrenatal(gestanteId);
    const { gestante, consultas, fatoresRisco, medicamentos, examesAgrupados, ultrassons, marcos } = dados;
    
    console.log('[PDF] Gerando PDF com PDFKit...');
    
    return new Promise(async (resolve, reject) => {
      try {
        const doc = new PDFDocument({ 
          size: 'A4', 
          margins: { top: 50, bottom: 50, left: 50, right: 50 },
          bufferPages: true
        });

        const chunks: Buffer[] = [];
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Cores
        const corPrimaria = '#8B4049'; // Vinho
        const corSecundaria = '#E8D4D6'; // Rosa claro
        const corTexto = '#333333';
        const corCinza = '#666666';

        // Logo
        const logoPath = path.join(process.cwd(), "client/public/logo-horizontal.png");
        if (fs.existsSync(logoPath)) {
          doc.image(logoPath, 50, 40, { width: 150 });
        }

        // Título
        doc.moveDown(4);
        doc.fontSize(24).fillColor(corPrimaria).text('Cartão de Pré-natal', { align: 'center' });
        doc.fontSize(10).fillColor(corCinza).text('Clínica Mais Mulher', { align: 'center' });
        doc.moveDown(1);
        
        // Linha separadora
        doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor(corPrimaria).lineWidth(2).stroke();
        doc.moveDown(1);

        // Dados da Gestante
        doc.fontSize(16).fillColor(corPrimaria).text('Dados da Gestante');
        doc.moveDown(0.5);
        
        const yInicial = doc.y;
        doc.fontSize(9).fillColor(corCinza);
        
        // Coluna 1
        doc.text('Nome Completo', 50, yInicial);
        doc.fontSize(11).fillColor(corTexto).text(gestante.nome || '-', 50, yInicial + 12);
        
        doc.fontSize(9).fillColor(corCinza).text('Telefone', 50, yInicial + 35);
        doc.fontSize(11).fillColor(corTexto).text(gestante.telefone || '-', 50, yInicial + 47);
        
        doc.fontSize(9).fillColor(corCinza).text('DUM', 50, yInicial + 70);
        const dumDisplay = gestante.dum === 'Incerta' || gestante.dum === 'Incompatível com US' 
          ? gestante.dum 
          : (gestante.dum ? formatarData(gestante.dum) : '-');
        doc.fontSize(11).fillColor(corTexto).text(dumDisplay, 50, yInicial + 82);
        
        // Coluna 2
        doc.fontSize(9).fillColor(corCinza).text('História Obstétrica', 220, yInicial);
        doc.fontSize(11).fillColor(corTexto).text(`G${gestante.gesta || 0}P${gestante.para || 0}A${gestante.abortos || 0}`, 220, yInicial + 12);
        
        doc.fontSize(9).fillColor(corCinza).text('Partos Normais', 220, yInicial + 35);
        doc.fontSize(11).fillColor(corTexto).text(gestante.partosNormais?.toString() || '-', 220, yInicial + 47);
        
        doc.fontSize(9).fillColor(corCinza).text('Cesáreas', 220, yInicial + 70);
        doc.fontSize(11).fillColor(corTexto).text(gestante.cesareas?.toString() || '-', 220, yInicial + 82);
        
        // Coluna 3
        doc.fontSize(9).fillColor(corCinza).text('Data Ultrassom', 390, yInicial);
        doc.fontSize(11).fillColor(corTexto).text(gestante.dataUltrassom ? formatarData(gestante.dataUltrassom) : '-', 390, yInicial + 12);
        
        doc.fontSize(9).fillColor(corCinza).text('IG no Ultrassom', 390, yInicial + 35);
        const igUSDisplay = gestante.igUltrassomSemanas !== null 
          ? `${gestante.igUltrassomSemanas}s ${gestante.igUltrassomDias || 0}d` 
          : '-';
        doc.fontSize(11).fillColor(corTexto).text(igUSDisplay, 390, yInicial + 47);
        
        doc.y = yInicial + 110;
        doc.moveDown(1);

        // Fatores de Risco
        if (fatoresRisco.length > 0) {
          doc.fontSize(14).fillColor(corPrimaria).text('Fatores de Risco');
          doc.moveDown(0.5);
          
          const nomesRisco: Record<string, string> = {
            diabetes_gestacional: 'Diabetes Gestacional',
            diabetes_tipo2: 'Diabetes Tipo 2',
            dpoc_asma: 'DPOC/Asma',
            epilepsia: 'Epilepsia',
            hipotireoidismo: 'Hipotireoidismo',
            hipertensao: 'Hipertensão',
            historico_familiar_dheg: 'Histórico familiar de DHEG',
            idade_avancada: 'Idade >= 35 anos',
            incompetencia_istmo_cervical: 'Incompetência Istmo-cervical',
            mal_passado_obstetrico: 'Mal Passado Obstétrico',
            malformacoes_mullerianas: 'Malformações Müllerianas',
            trombofilia: 'Trombofilia',
            fator_rh_negativo: 'Fator Rh Negativo',
            outro: 'Outro',
          };
          
          let xPos = 50;
          let yPos = doc.y;
          
          fatoresRisco.forEach((fator) => {
            const nome = nomesRisco[fator.tipo] || fator.tipo.replace(/_/g, ' ');
            const larguraTexto = doc.widthOfString(nome) + 20;
            
            if (xPos + larguraTexto > 545) {
              xPos = 50;
              yPos += 25;
            }
            
            // Badge de fator de risco
            doc.roundedRect(xPos, yPos, larguraTexto, 20, 10).fillColor('#fee2e2').fill();
            doc.fontSize(9).fillColor('#991b1b').text(nome, xPos + 10, yPos + 5);
            
            xPos += larguraTexto + 10;
          });
          
          doc.y = yPos + 30;
          doc.moveDown(1);
        }

        // Medicamentos
        if (medicamentos.length > 0) {
          doc.fontSize(14).fillColor(corPrimaria).text('Medicamentos em Uso');
          doc.moveDown(0.5);
          
          let xPos = 50;
          let yPos = doc.y;
          
          medicamentos.forEach((med) => {
            const nome = med.especificacao || med.tipo.replace(/_/g, ' ');
            const larguraTexto = doc.widthOfString(nome) + 20;
            
            if (xPos + larguraTexto > 545) {
              xPos = 50;
              yPos += 25;
            }
            
            // Badge de medicamento
            doc.roundedRect(xPos, yPos, larguraTexto, 20, 10).fillColor('#dbeafe').fill();
            doc.fontSize(9).fillColor('#1e40af').text(nome, xPos + 10, yPos + 5);
            
            xPos += larguraTexto + 10;
          });
          
          doc.y = yPos + 30;
          doc.moveDown(1);
        }

        // Consultas Pré-natais
        if (consultas.length > 0) {
          // Nova página se necessário
          if (doc.y > 550) {
            doc.addPage();
          }
          
          doc.fontSize(14).fillColor(corPrimaria).text('Histórico de Consultas');
          doc.moveDown(0.5);
          
          // Cabeçalho da tabela
          const tableTop = doc.y;
          doc.fontSize(8).fillColor('white');
          doc.rect(50, tableTop, 495, 20).fillColor(corPrimaria).fill();
          
          doc.fillColor('white');
          doc.text('Data', 55, tableTop + 6, { width: 50 });
          doc.text('IG DUM', 110, tableTop + 6, { width: 45 });
          doc.text('IG US', 160, tableTop + 6, { width: 45 });
          doc.text('Peso', 210, tableTop + 6, { width: 40 });
          doc.text('PA', 255, tableTop + 6, { width: 45 });
          doc.text('AU', 305, tableTop + 6, { width: 30 });
          doc.text('BCF', 340, tableTop + 6, { width: 30 });
          doc.text('Conduta', 375, tableTop + 6, { width: 80 });
          doc.text('Obs', 460, tableTop + 6, { width: 85 });
          
          doc.y = tableTop + 20;
          
          // Linhas da tabela
          consultas.slice(0, 15).forEach((consulta, index) => {
            const rowY = doc.y;
            
            // Nova página se necessário
            if (rowY > 720) {
              doc.addPage();
              doc.y = 50;
            }
            
            // Fundo alternado
            if (index % 2 === 0) {
              doc.rect(50, doc.y, 495, 22).fillColor('#f9f9f9').fill();
            }
            
            const currentY = doc.y;
            
            // Calcular IGs
            const igDUM = calcularIG(consulta.dataConsulta, gestante.dum);
            const igUS = gestante.dataUltrassom ? calcularIGPorUS(
              consulta.dataConsulta,
              gestante.dataUltrassom,
              gestante.igUltrassomSemanas,
              gestante.igUltrassomDias
            ) : null;
            
            doc.fontSize(8).fillColor(corTexto);
            doc.text(formatarData(consulta.dataConsulta), 55, currentY + 5, { width: 50 });
            doc.text(igDUM ? `${igDUM.semanas}s ${igDUM.dias}d` : '-', 110, currentY + 5, { width: 45 });
            doc.text(igUS ? `${igUS.semanas}s ${igUS.dias}d` : '-', 160, currentY + 5, { width: 45 });
            doc.text(consulta.peso ? `${consulta.peso} kg` : '-', 210, currentY + 5, { width: 40 });
            doc.text(consulta.pressaoArterial || '-', 255, currentY + 5, { width: 45 });
            doc.text(consulta.alturaUterina ? `${consulta.alturaUterina}` : '-', 305, currentY + 5, { width: 30 });
            doc.text(consulta.bcf ? 'Sim' : '-', 340, currentY + 5, { width: 30 });
            
            const condutaTexto = consulta.conduta || '-';
            doc.text(condutaTexto.substring(0, 15), 375, currentY + 5, { width: 80 });
            
            const obsTexto = consulta.observacoes || '-';
            doc.text(obsTexto.substring(0, 20), 460, currentY + 5, { width: 85 });
            
            doc.y = currentY + 22;
          });
        }

        // Marcos Importantes
        if (marcos.length > 0) {
          // Nova página se necessário
          if (doc.y > 550) {
            doc.addPage();
          }
          
          doc.fontSize(14).fillColor(corPrimaria).text('Marcos Importantes');
          doc.moveDown(0.5);
          
          let xPos = 50;
          let yPos = doc.y;
          
          marcos.forEach((marco) => {
            const larguraTexto = doc.widthOfString(marco.titulo) + 20;
            
            if (xPos + larguraTexto > 545) {
              xPos = 50;
              yPos += 30;
            }
            
            // Cores baseadas no status (tons mais claros)
            let bgColor = '#e8f5e9'; // Verde claro - concluido
            let textColor = '#2e7d32';
            if (marco.status === 'atual') {
              bgColor = '#fff3e0'; // Laranja claro
              textColor = '#e65100';
            } else if (marco.status === 'pendente') {
              bgColor = '#f5f5f5'; // Cinza claro
              textColor = '#616161';
            }
            
            // Badge de marco
            doc.roundedRect(xPos, yPos, larguraTexto, 25, 8).fillColor(bgColor).fill();
            doc.fontSize(8).fillColor(textColor).text(marco.titulo, xPos + 10, yPos + 4);
            doc.fontSize(7).fillColor(textColor).text(`${marco.semanaInicio}-${marco.semanaFim}s`, xPos + 10, yPos + 14);
            
            xPos += larguraTexto + 10;
          });
          
          doc.y = yPos + 40;
          doc.moveDown(1);
        }

        // Ultrassons
        if (ultrassons.length > 0) {
          // Nova página se necessário
          if (doc.y > 550) {
            doc.addPage();
          }
          
          doc.fontSize(14).fillColor(corPrimaria).text('Ultrassons');
          doc.moveDown(0.5);
          
          // Cabeçalho da tabela
          const tableTop = doc.y;
          doc.fontSize(8).fillColor('white');
          doc.rect(50, tableTop, 495, 18).fillColor(corPrimaria).fill();
          
          doc.fillColor('white');
          doc.text('Tipo', 55, tableTop + 5, { width: 120 });
          doc.text('Data', 180, tableTop + 5, { width: 60 });
          doc.text('IG', 245, tableTop + 5, { width: 50 });
          doc.text('Observações', 300, tableTop + 5, { width: 245 });
          
          doc.y = tableTop + 18;
          
          const tiposUltrassom: Record<string, string> = {
            'primeiro_ultrassom': '1º Ultrassom',
            'morfologico_1tri': 'Morfológico 1º Tri',
            'ultrassom_obstetrico': 'US Obstétrico',
            'morfologico_2tri': 'Morfológico 2º Tri',
            'ecocardiograma_fetal': 'Ecocardiograma Fetal',
            'ultrassom_seguimento': 'US Seguimento',
          };
          
          ultrassons.slice(0, 10).forEach((us, index) => {
            const rowY = doc.y;
            
            // Nova página se necessário
            if (rowY > 720) {
              doc.addPage();
              doc.y = 50;
            }
            
            // Fundo alternado
            if (index % 2 === 0) {
              doc.rect(50, doc.y, 495, 20).fillColor('#f9f9f9').fill();
            }
            
            const currentY = doc.y;
            const dados = us.dados as any || {};
            
            doc.fontSize(8).fillColor(corTexto);
            doc.text(tiposUltrassom[us.tipoUltrassom] || us.tipoUltrassom, 55, currentY + 5, { width: 120 });
            doc.text(us.dataExame ? formatarData(us.dataExame) : '-', 180, currentY + 5, { width: 60 });
            doc.text(us.idadeGestacional || '-', 245, currentY + 5, { width: 50 });
            
            // Extrair observações relevantes dos dados
            let obs = '';
            if (dados.observacoes) obs = dados.observacoes;
            else if (dados.ccn) obs = `CCN: ${dados.ccn}`;
            else if (dados.tn) obs = `TN: ${dados.tn}`;
            else if (dados.pesoFetal) obs = `Peso: ${dados.pesoFetal}`;
            
            doc.text(obs.substring(0, 50), 300, currentY + 5, { width: 245 });
            
            doc.y = currentY + 20;
          });
          
          doc.moveDown(1);
        }

        // Gráficos de Evolução
        if (consultas.length > 0) {
          doc.addPage();
          
          doc.fontSize(14).fillColor(corPrimaria).text('Gráficos de Evolução');
          doc.moveDown(0.5);
          
          try {
            // Gráfico de Peso
            const graficoPesoBuffer = await gerarGraficoPeso(consultas, gestante.pesoInicial || null, gestante.altura || null);
            doc.image(graficoPesoBuffer, 50, doc.y, { width: 495, height: 180 });
            doc.y += 190;
            
            // Gráfico de AU
            const graficoAUBuffer = await gerarGraficoAU(consultas);
            doc.image(graficoAUBuffer, 50, doc.y, { width: 495, height: 180 });
            doc.y += 190;
            
            // Nova página para PA
            doc.addPage();
            
            // Gráfico de PA
            const graficoPABuffer = await gerarGraficoPA(consultas);
            doc.image(graficoPABuffer, 50, 50, { width: 495, height: 180 });
            doc.y = 240;
            
          } catch (chartError) {
            console.error('[PDF] Erro ao gerar gráficos:', chartError);
            doc.fontSize(10).fillColor(corCinza).text('Erro ao gerar gráficos de evolução');
          }
        }

        // Exames Laboratoriais
        if (examesAgrupados.length > 0) {
          // Nova página
          doc.addPage();
          
          doc.fontSize(14).fillColor(corPrimaria).text('Exames Laboratoriais');
          doc.moveDown(0.5);
          
          // Cabeçalho da tabela
          const tableTop = doc.y;
          doc.fontSize(7).fillColor('white');
          doc.rect(50, tableTop, 495, 18).fillColor(corPrimaria).fill();
          
          doc.fillColor('white');
          doc.text('Exame', 55, tableTop + 5, { width: 90 });
          doc.text('1º Tri Data', 150, tableTop + 5, { width: 50 });
          doc.text('1º Tri Res.', 205, tableTop + 5, { width: 50 });
          doc.text('2º Tri Data', 260, tableTop + 5, { width: 50 });
          doc.text('2º Tri Res.', 315, tableTop + 5, { width: 50 });
          doc.text('3º Tri Data', 370, tableTop + 5, { width: 50 });
          doc.text('3º Tri Res.', 425, tableTop + 5, { width: 70 });
          
          doc.y = tableTop + 18;
          
          examesAgrupados.forEach((exame, index) => {
            const rowY = doc.y;
            
            // Nova página se necessário
            if (rowY > 720) {
              doc.addPage();
              doc.y = 50;
            }
            
            // Fundo alternado
            if (index % 2 === 0) {
              doc.rect(50, doc.y, 495, 16).fillColor('#f9f9f9').fill();
            }
            
            const currentY = doc.y;
            
            doc.fontSize(7).fillColor(corTexto);
            doc.text(exame.nome.substring(0, 18), 55, currentY + 4, { width: 90 });
            doc.text(exame.trimestre1.data ? formatarData(exame.trimestre1.data) : '-', 150, currentY + 4, { width: 50 });
            doc.text((exame.trimestre1.resultado || '-').substring(0, 10), 205, currentY + 4, { width: 50 });
            doc.text(exame.trimestre2.data ? formatarData(exame.trimestre2.data) : '-', 260, currentY + 4, { width: 50 });
            doc.text((exame.trimestre2.resultado || '-').substring(0, 10), 315, currentY + 4, { width: 50 });
            doc.text(exame.trimestre3.data ? formatarData(exame.trimestre3.data) : '-', 370, currentY + 4, { width: 50 });
            doc.text((exame.trimestre3.resultado || '-').substring(0, 12), 425, currentY + 4, { width: 70 });
            
            doc.y = currentY + 16;
          });
        }

        // Rodaé
        const pageCount = doc.bufferedPageRange().count;;
        for (let i = 0; i < pageCount; i++) {
          doc.switchToPage(i);
          doc.fontSize(8).fillColor(corCinza);
          doc.text(
            `Gerado em ${new Date().toLocaleDateString('pt-BR')} - Página ${i + 1} de ${pageCount}`,
            50,
            780,
            { align: 'center', width: 495 }
          );
        }

        doc.end();
        console.log('[PDF] PDF gerado com sucesso!');
        
      } catch (error) {
        reject(error);
      }
    });
    
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    writeFileSync('/tmp/pdf_erro.txt', `Erro ao gerar PDF em ${new Date().toISOString()}:\n${error instanceof Error ? error.stack : String(error)}`);
    throw new Error(`Falha ao gerar PDF: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
}
