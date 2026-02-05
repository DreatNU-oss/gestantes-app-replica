import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * Gera PDF a partir de um elemento HTML
 * Captura o elemento como imagem e converte para PDF
 */
export async function gerarPDFDoElemento(
  elemento: HTMLElement,
  nomeArquivo: string = 'documento.pdf',
  opcoes?: {
    margemMm?: number;
    escala?: number;
  }
): Promise<void> {
  const { margemMm = 10, escala = 2 } = opcoes || {};

  // Capturar elemento como canvas
  const canvas = await html2canvas(elemento, {
    scale: escala,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    logging: false,
  });

  // Dimensões do PDF A4 em mm
  const pdfLarguraMm = 210;
  const pdfAlturaMm = 297;
  
  // Área útil (descontando margens)
  const areaUtilLargura = pdfLarguraMm - (margemMm * 2);
  const areaUtilAltura = pdfAlturaMm - (margemMm * 2);

  // Calcular proporção do canvas
  const canvasLargura = canvas.width;
  const canvasAltura = canvas.height;
  const proporcaoCanvas = canvasAltura / canvasLargura;

  // Calcular quantas páginas serão necessárias
  const larguraImagem = areaUtilLargura;
  const alturaImagemTotal = larguraImagem * proporcaoCanvas;
  const numPaginas = Math.ceil(alturaImagemTotal / areaUtilAltura);

  // Criar PDF
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Altura do canvas por página (em pixels)
  const alturaCanvasPorPagina = (canvasLargura * areaUtilAltura) / areaUtilLargura;

  for (let pagina = 0; pagina < numPaginas; pagina++) {
    if (pagina > 0) {
      pdf.addPage();
    }

    // Criar canvas temporário para esta página
    const canvasPagina = document.createElement('canvas');
    canvasPagina.width = canvasLargura;
    canvasPagina.height = Math.min(alturaCanvasPorPagina, canvasAltura - (pagina * alturaCanvasPorPagina));
    
    const ctx = canvasPagina.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvasPagina.width, canvasPagina.height);
      
      // Desenhar parte do canvas original
      ctx.drawImage(
        canvas,
        0, pagina * alturaCanvasPorPagina, // Origem no canvas original
        canvasLargura, canvasPagina.height, // Tamanho a copiar
        0, 0, // Destino no canvas da página
        canvasLargura, canvasPagina.height // Tamanho no destino
      );
    }

    // Converter para imagem e adicionar ao PDF
    const imgData = canvasPagina.toDataURL('image/jpeg', 0.95);
    const alturaImagemPagina = (canvasPagina.height / canvasLargura) * areaUtilLargura;
    
    pdf.addImage(
      imgData,
      'JPEG',
      margemMm,
      margemMm,
      areaUtilLargura,
      alturaImagemPagina
    );
  }

  // Baixar PDF
  pdf.save(nomeArquivo);
}

/**
 * Abre uma nova janela com a página de impressão e gera PDF dela
 */
export async function gerarPDFDaPaginaImpressao(
  gestanteId: number,
  nomeGestante: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    // Abrir página de impressão em nova janela
    const url = `/cartao-prenatal-impressao/${gestanteId}`;
    const janela = window.open(url, '_blank', 'width=900,height=1200');
    
    if (!janela) {
      reject(new Error('Não foi possível abrir a janela de impressão. Verifique se popups estão bloqueados.'));
      return;
    }

    // Aguardar a página carregar completamente
    const verificarCarregamento = setInterval(async () => {
      try {
        // Verificar se a página carregou
        if (janela.document.body.getAttribute('data-content-loaded') === 'true') {
          clearInterval(verificarCarregamento);
          
          // Aguardar mais um pouco para gráficos renderizarem
          await new Promise(r => setTimeout(r, 2000));
          
          // Encontrar o container principal
          const container = janela.document.querySelector('.print-container') as HTMLElement;
          
          if (container) {
            await gerarPDFDoElemento(
              container,
              `cartao-prenatal-${nomeGestante.replace(/\s+/g, '-').toLowerCase()}.pdf`
            );
            janela.close();
            resolve();
          } else {
            janela.close();
            reject(new Error('Container de impressão não encontrado'));
          }
        }
      } catch (e) {
        // Pode dar erro de cross-origin, ignorar e continuar tentando
      }
    }, 500);

    // Timeout após 30 segundos
    setTimeout(() => {
      clearInterval(verificarCarregamento);
      janela.close();
      reject(new Error('Timeout aguardando carregamento da página'));
    }, 30000);
  });
}
