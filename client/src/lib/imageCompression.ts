/**
 * Utilitário para compressão de imagens antes do upload
 * Redimensiona imagens grandes para acelerar o processamento
 */

interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  mimeType?: 'image/jpeg' | 'image/png' | 'image/webp';
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 0.85,
  mimeType: 'image/jpeg',
};

/**
 * Comprime uma imagem redimensionando e ajustando a qualidade
 * @param file - Arquivo de imagem original
 * @param options - Opções de compressão
 * @returns Promise com o arquivo comprimido e informações
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<{ file: File; originalSize: number; compressedSize: number; wasCompressed: boolean }> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Se não for imagem, retornar original
  if (!file.type.startsWith('image/')) {
    return {
      file,
      originalSize: file.size,
      compressedSize: file.size,
      wasCompressed: false,
    };
  }

  // Se for PDF, retornar original
  if (file.type === 'application/pdf') {
    return {
      file,
      originalSize: file.size,
      compressedSize: file.size,
      wasCompressed: false,
    };
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Não foi possível criar contexto do canvas'));
      return;
    }

    img.onload = () => {
      let { width, height } = img;
      const originalSize = file.size;

      // Calcular novas dimensões mantendo proporção
      if (width > opts.maxWidth! || height > opts.maxHeight!) {
        const ratio = Math.min(opts.maxWidth! / width, opts.maxHeight! / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      } else {
        // Imagem já é pequena o suficiente, verificar se precisa comprimir qualidade
        if (file.size < 500 * 1024) { // Menor que 500KB
          resolve({
            file,
            originalSize,
            compressedSize: file.size,
            wasCompressed: false,
          });
          return;
        }
      }

      canvas.width = width;
      canvas.height = height;

      // Desenhar imagem redimensionada
      ctx.drawImage(img, 0, 0, width, height);

      // Converter para blob
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Falha ao comprimir imagem'));
            return;
          }

          // Criar novo arquivo com o blob comprimido
          const compressedFile = new File(
            [blob],
            file.name.replace(/\.[^.]+$/, '.jpg'), // Mudar extensão para jpg
            { type: opts.mimeType }
          );

          resolve({
            file: compressedFile,
            originalSize,
            compressedSize: compressedFile.size,
            wasCompressed: true,
          });
        },
        opts.mimeType,
        opts.quality
      );
    };

    img.onerror = () => {
      reject(new Error('Falha ao carregar imagem'));
    };

    // Carregar imagem do arquivo
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      reject(new Error('Falha ao ler arquivo'));
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Formata o tamanho do arquivo para exibição
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

/**
 * Calcula a porcentagem de redução
 */
export function calculateReduction(original: number, compressed: number): number {
  if (original === 0) return 0;
  return Math.round(((original - compressed) / original) * 100);
}
