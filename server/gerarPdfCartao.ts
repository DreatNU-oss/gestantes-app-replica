import PDFDocument from "pdfkit";
import path from "path";
import fs from "fs";

interface DadosGestante {
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
}

interface Consulta {
  dataConsulta: string;
  igDUM: string;
  igUS: string | null;
  peso: number | null;
  pa: string | null;
  au: number | null;
  bcf: number | null;
  mf: number | null;
  conduta: string | null;
  condutaComplementacao: string | null;
  observacoes: string | null;
}

interface Marco {
  titulo: string;
  data: string;
  periodo: string;
}

interface Ultrassom {
  data: string;
  ig: string;
  tipo: string;
  observacoes: string | null;
}

interface Exame {
  tipo: string;
  data: string;
  resultado: string;
  trimestre: number;
}

interface DadosPDF {
  gestante: DadosGestante;
  consultas: Consulta[];
  marcos: Marco[];
  ultrassons: Ultrassom[];
  exames: Exame[];
}

export async function gerarPdfCartaoPrenatal(dados: DadosPDF): Promise<Buffer> {
  return new Promise((resolve, reject) => {
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
      doc.fontSize(11).fillColor(corTexto).text(dados.gestante.nome || '-', 50, yInicial + 12);
      
      doc.fontSize(9).fillColor(corCinza).text('Idade', 50, yInicial + 35);
      doc.fontSize(11).fillColor(corTexto).text(dados.gestante.idade ? `${dados.gestante.idade} anos` : '-', 50, yInicial + 47);
      
      doc.fontSize(9).fillColor(corCinza).text('DUM', 50, yInicial + 70);
      doc.fontSize(11).fillColor(corTexto).text(dados.gestante.dum || '-', 50, yInicial + 82);
      
      // Coluna 2
      doc.fontSize(9).fillColor(corCinza).text('DPP pela DUM', 220, yInicial);
      doc.fontSize(11).fillColor(corTexto).text(dados.gestante.dppDUM || '-', 220, yInicial + 12);
      
      doc.fontSize(9).fillColor(corCinza).text('DPP pelo US', 220, yInicial + 35);
      doc.fontSize(11).fillColor(corTexto).text(dados.gestante.dppUS || '-', 220, yInicial + 47);
      
      doc.fontSize(9).fillColor(corCinza).text('Gesta', 220, yInicial + 70);
      doc.fontSize(11).fillColor(corTexto).text(dados.gestante.gesta?.toString() || '-', 220, yInicial + 82);
      
      // Coluna 3
      doc.fontSize(9).fillColor(corCinza).text('Para', 390, yInicial);
      doc.fontSize(11).fillColor(corTexto).text(dados.gestante.para?.toString() || '-', 390, yInicial + 12);
      
      doc.fontSize(9).fillColor(corCinza).text('Abortos', 390, yInicial + 35);
      doc.fontSize(11).fillColor(corTexto).text(dados.gestante.abortos?.toString() || '-', 390, yInicial + 47);
      
      doc.fontSize(9).fillColor(corCinza).text('Partos Normais', 390, yInicial + 70);
      doc.fontSize(11).fillColor(corTexto).text(dados.gestante.partosNormais?.toString() || '-', 390, yInicial + 82);
      
      doc.fontSize(9).fillColor(corCinza).text('Cesáreas', 470, yInicial + 70);
      doc.fontSize(11).fillColor(corTexto).text(dados.gestante.cesareas?.toString() || '-', 470, yInicial + 82);
      
      doc.y = yInicial + 110;
      doc.moveDown(1);

      // Consultas Pré-natais
      if (dados.consultas.length > 0) {
        doc.fontSize(14).fillColor(corPrimaria).text('Histórico de Consultas');
        doc.moveDown(0.5);
        
        // Cabeçalho da tabela
        const tableTop = doc.y;
        doc.fontSize(8).fillColor('white');
        doc.rect(50, tableTop, 495, 20).fillColor(corPrimaria).fill();
        
        doc.fillColor('white');
        doc.text('Data', 55, tableTop + 6, { width: 45 });
        doc.text('IG DUM', 105, tableTop + 6, { width: 40 });
        doc.text('IG US', 150, tableTop + 6, { width: 40 });
        doc.text('Peso', 195, tableTop + 6, { width: 35 });
        doc.text('PA', 235, tableTop + 6, { width: 35 });
        doc.text('AU', 275, tableTop + 6, { width: 25 });
        doc.text('BCF', 305, tableTop + 6, { width: 25 });
        doc.text('MF', 335, tableTop + 6, { width: 25 });
        doc.text('Conduta', 365, tableTop + 6, { width: 80 });
        doc.text('Obs', 450, tableTop + 6, { width: 90 });
        
        doc.y = tableTop + 20;
        
        // Linhas da tabela
        dados.consultas.slice(0, 10).forEach((consulta, index) => {
          const rowY = doc.y;
          
          // Fundo alternado
          if (index % 2 === 0) {
            doc.rect(50, rowY, 495, 25).fillColor('#f9f9f9').fill();
          }
          
          doc.fontSize(8).fillColor(corTexto);
          doc.text(consulta.dataConsulta || '-', 55, rowY + 5, { width: 45 });
          doc.text(consulta.igDUM || '-', 105, rowY + 5, { width: 40 });
          doc.text(consulta.igUS || '-', 150, rowY + 5, { width: 40 });
          doc.text(consulta.peso ? `${consulta.peso} kg` : '-', 195, rowY + 5, { width: 35 });
          doc.text(consulta.pa || '-', 235, rowY + 5, { width: 35 });
          doc.text(consulta.au ? `${consulta.au} cm` : '-', 275, rowY + 5, { width: 25 });
          doc.text(consulta.bcf?.toString() || '-', 305, rowY + 5, { width: 25 });
          doc.text(consulta.mf?.toString() || '-', 335, rowY + 5, { width: 25 });
          
          const condutaTexto = consulta.conduta || '-';
          doc.text(condutaTexto.substring(0, 20), 365, rowY + 5, { width: 80 });
          
          const obsTexto = consulta.observacoes || '-';
          doc.text(obsTexto.substring(0, 30), 450, rowY + 5, { width: 90 });
          
          doc.y = rowY + 25;
          
          // Nova página se necessário
          if (doc.y > 700) {
            doc.addPage();
          }
        });
        
        doc.moveDown(1);
      }

      // Marcos Importantes
      if (dados.marcos.length > 0 && doc.y < 650) {
        doc.fontSize(14).fillColor(corPrimaria).text('Marcos Importantes da Gestação');
        doc.moveDown(0.5);
        
        const coresMarcos = ['#D8BFD8', '#B0E0E6', '#FFE4B5', '#98FB98', '#FFB6C1'];
        
        dados.marcos.slice(0, 8).forEach((marco, index) => {
          if (doc.y > 720) {
            doc.addPage();
          }
          
          const marcoY = doc.y;
          const cor = coresMarcos[index % coresMarcos.length];
          
          doc.rect(50, marcoY, 240, 30).fillColor(cor).fill();
          doc.fontSize(10).fillColor(corTexto).text(marco.titulo, 60, marcoY + 8, { width: 220 });
          doc.fontSize(9).fillColor(corCinza).text(marco.data, 60, marcoY + 20, { width: 220 });
          
          doc.y = marcoY + 35;
        });
        
        doc.moveDown(1);
      }

      // Ultrassons
      if (dados.ultrassons.length > 0 && doc.y < 650) {
        doc.fontSize(14).fillColor(corPrimaria).text('Ultrassons');
        doc.moveDown(0.5);
        
        dados.ultrassons.slice(0, 5).forEach((us) => {
          if (doc.y > 720) {
            doc.addPage();
          }
          
          doc.fontSize(9).fillColor(corCinza).text(`Data: ${us.data} | IG: ${us.ig} | Tipo: ${us.tipo}`);
          doc.moveDown(0.3);
        });
        
        doc.moveDown(0.5);
      }

      // Exames Laboratoriais
      if (dados.exames.length > 0 && doc.y < 650) {
        doc.fontSize(14).fillColor(corPrimaria).text('Exames Laboratoriais');
        doc.moveDown(0.5);
        
        dados.exames.slice(0, 10).forEach((exame) => {
          if (doc.y > 720) {
            doc.addPage();
          }
          
          doc.fontSize(9).fillColor(corTexto).text(`${exame.tipo}: ${exame.resultado} (${exame.data})`);
          doc.moveDown(0.3);
        });
      }

      // Rodapé em todas as páginas
      const pages = doc.bufferedPageRange();
      for (let i = 0; i < pages.count; i++) {
        doc.switchToPage(i);
        doc.fontSize(8).fillColor(corCinza).text(
          `Página ${i + 1} de ${pages.count} - Clínica Mais Mulher`,
          50,
          doc.page.height - 40,
          { align: 'center' }
        );
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
