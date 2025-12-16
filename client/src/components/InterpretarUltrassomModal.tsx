import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Upload, AlertCircle, X, CheckCircle, FileText, Image, Minimize2 } from 'lucide-react';
import { compressImage, formatFileSize, calculateReduction } from '@/lib/imageCompression';
import { toast } from 'sonner';

interface InterpretarUltrassomModalProps {
  open: boolean;
  onClose: () => void;
  onDadosExtraidos: (tipo: string, dados: Record<string, string>) => void;
}

interface FileWithStatus {
  file: File;
  originalFile?: File;
  status: 'pending' | 'compressing' | 'uploading' | 'processing' | 'success' | 'error';
  error?: string;
  wasCompressed?: boolean;
  originalSize?: number;
  compressedSize?: number;
}

const tiposUltrassom = [
  { value: 'primeiro_ultrassom', label: '1º Ultrassom' },
  { value: 'morfologico_1tri', label: 'Morfológico 1º Trimestre' },
  { value: 'ultrassom_obstetrico', label: 'Ultrassom Obstétrico' },
  { value: 'morfologico_2tri', label: 'Morfológico 2º Trimestre' },
  { value: 'ecocardiograma', label: 'Ecocardiograma Fetal' },
  { value: 'ultrassom_seguimento', label: 'Ultrassom de Seguimento' },
];

export function InterpretarUltrassomModal({ open, onClose, onDadosExtraidos }: InterpretarUltrassomModalProps) {
  const [tipoSelecionado, setTipoSelecionado] = useState<string>('');
  const [files, setFiles] = useState<FileWithStatus[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [error, setError] = useState<string>('');

  const interpretarMutation = trpc.ultrassons.interpretar.useMutation();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    const validFiles: FileWithStatus[] = [];
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    
    for (const file of selectedFiles) {
      // Validar tipo de arquivo
      if (!validTypes.includes(file.type)) {
        setError(`${file.name}: Tipo inválido. Aceito: PDF, JPEG, PNG, WEBP`);
        continue;
      }
      
      // Validar tamanho (máximo 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError(`${file.name}: Arquivo muito grande. Máximo: 10MB`);
        continue;
      }
      
      validFiles.push({ file, status: 'pending' });
    }
    
    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles]);
      setError('');
    }
    
    // Limpar input para permitir selecionar os mesmos arquivos novamente
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const processFile = async (fileWithStatus: FileWithStatus, index: number): Promise<Record<string, string>> => {
    let fileToUpload = fileWithStatus.file;
    
    // 1. Comprimir imagem se necessário
    if (fileWithStatus.file.type.startsWith('image/')) {
      setFiles(prev => prev.map((f, i) => 
        i === index ? { ...f, status: 'compressing' } : f
      ));
      
      try {
        const compressionResult = await compressImage(fileWithStatus.file, {
          maxWidth: 1920,
          maxHeight: 1920,
          quality: 0.85,
        });
        
        fileToUpload = compressionResult.file;
        
        // Atualizar informações de compressão
        setFiles(prev => prev.map((f, i) => 
          i === index ? { 
            ...f, 
            file: compressionResult.file,
            originalFile: fileWithStatus.file,
            wasCompressed: compressionResult.wasCompressed,
            originalSize: compressionResult.originalSize,
            compressedSize: compressionResult.compressedSize,
          } : f
        ));
        
        if (compressionResult.wasCompressed) {
          const reduction = calculateReduction(compressionResult.originalSize, compressionResult.compressedSize);
          console.log(`Imagem comprimida: ${formatFileSize(compressionResult.originalSize)} → ${formatFileSize(compressionResult.compressedSize)} (-${reduction}%)`);
        }
      } catch (err) {
        console.warn('Falha ao comprimir imagem, usando original:', err);
      }
    }
    
    // 2. Atualizar status para uploading
    setFiles(prev => prev.map((f, i) => 
      i === index ? { ...f, status: 'uploading' } : f
    ));

    // 3. Converter arquivo para base64
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64Data = result.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
      reader.readAsDataURL(fileWithStatus.file);
    });

    // 2. Fazer upload do arquivo para S3
    const uploadResponse = await fetch('/api/upload-laudo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: fileWithStatus.file.name,
        fileData: base64,
        mimeType: fileWithStatus.file.type,
      }),
    });

    if (!uploadResponse.ok) {
      throw new Error('Erro ao fazer upload do arquivo');
    }

    const { url: fileUrl } = await uploadResponse.json();

    // Atualizar status para processing
    setFiles(prev => prev.map((f, i) => 
      i === index ? { ...f, status: 'processing' } : f
    ));

    // 3. Chamar IA para interpretar
    const result = await interpretarMutation.mutateAsync({
      fileUrl,
      tipoUltrassom: tipoSelecionado as any,
      mimeType: fileWithStatus.file.type,
    });

    // Atualizar status para success
    setFiles(prev => prev.map((f, i) => 
      i === index ? { ...f, status: 'success' } : f
    ));

    return result.dados;
  };

  const handleInterpretar = async () => {
    if (files.length === 0 || !tipoSelecionado) return;

    setIsProcessing(true);
    setCurrentFileIndex(0);
    setError('');
    
    let combinedDados: Record<string, string> = {};
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < files.length; i++) {
      setCurrentFileIndex(i);

      try {
        const dados = await processFile(files[i], i);
        // Mesclar dados (valores posteriores sobrescrevem anteriores)
        combinedDados = { ...combinedDados, ...dados };
        successCount++;
      } catch (err) {
        errorCount++;
        const errorMsg = err instanceof Error ? err.message : 'Erro desconhecido';
        setFiles(prev => prev.map((f, idx) => 
          idx === i ? { ...f, status: 'error', error: errorMsg } : f
        ));
        console.error(`Erro ao processar ${files[i].file.name}:`, err);
      }
    }

    setIsProcessing(false);

    if (successCount > 0) {
      // Aguardar um pouco para mostrar os status antes de fechar
      setTimeout(() => {
        onDadosExtraidos(tipoSelecionado, combinedDados);
        handleClose();
      }, 1500);
    } else {
      setError('Nenhum arquivo foi processado com sucesso');
    }
  };

  const handleClose = () => {
    setTipoSelecionado('');
    setFiles([]);
    setError('');
    setIsProcessing(false);
    setCurrentFileIndex(0);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Interpretar Laudo de Ultrassom com IA</DialogTitle>
          <DialogDescription>
            Faça upload de um ou mais arquivos (PDF ou fotos) do laudo de ultrassom para preencher automaticamente os campos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Seleção de Tipo de Ultrassom */}
          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo de Ultrassom *</Label>
            <Select value={tipoSelecionado} onValueChange={setTipoSelecionado} disabled={isProcessing}>
              <SelectTrigger id="tipo">
                <SelectValue placeholder="Selecione o tipo de ultrassom" />
              </SelectTrigger>
              <SelectContent>
                {tiposUltrassom.map((tipo) => (
                  <SelectItem key={tipo.value} value={tipo.value}>
                    {tipo.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Upload de Arquivos */}
          <div className="space-y-2">
            <Label htmlFor="arquivo">Arquivos do Laudo *</Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('arquivo')?.click()}
                className="w-full"
                disabled={isProcessing}
              >
                <Upload className="mr-2 h-4 w-4" />
                {files.length > 0 ? 'Adicionar Mais Arquivos' : 'Selecionar Arquivos'}
              </Button>
              <input
                id="arquivo"
                type="file"
                accept=".pdf,image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="hidden"
                multiple
              />
            </div>
            
            {/* Lista de arquivos selecionados */}
            {files.length > 0 && (
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {files.map((fileWithStatus, index) => (
                  <div 
                    key={index} 
                    className={`flex items-center gap-2 p-3 rounded-md ${
                      fileWithStatus.status === 'success' ? 'bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800' :
                      fileWithStatus.status === 'error' ? 'bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800' :
                      (fileWithStatus.status === 'uploading' || fileWithStatus.status === 'processing' || fileWithStatus.status === 'compressing') ? 'bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800' :
                      'bg-muted'
                    }`}
                  >
                    {(fileWithStatus.status === 'uploading' || fileWithStatus.status === 'processing' || fileWithStatus.status === 'compressing') ? (
                      <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                    ) : fileWithStatus.status === 'success' ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : fileWithStatus.status === 'error' ? (
                      <X className="h-5 w-5 text-red-500" />
                    ) : fileWithStatus.file.type === 'application/pdf' ? (
                      <FileText className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <Image className="h-5 w-5 text-muted-foreground" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{fileWithStatus.file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {fileWithStatus.wasCompressed && fileWithStatus.originalSize ? (
                          <>
                            <span className="text-green-600">
                              <Minimize2 className="inline h-3 w-3 mr-1" />
                              {formatFileSize(fileWithStatus.originalSize)} → {formatFileSize(fileWithStatus.compressedSize || 0)}
                              {' '}(-{calculateReduction(fileWithStatus.originalSize, fileWithStatus.compressedSize || 0)}%)
                            </span>
                          </>
                        ) : (
                          <>{(fileWithStatus.file.size / 1024 / 1024).toFixed(2)} MB</>
                        )}
                        {fileWithStatus.status === 'compressing' && ' - Comprimindo...'}
                        {fileWithStatus.status === 'uploading' && ' - Enviando...'}
                        {fileWithStatus.status === 'processing' && ' - Interpretando...'}
                        {fileWithStatus.status === 'success' && ' - Concluído!'}
                        {fileWithStatus.status === 'error' && ` - Erro: ${fileWithStatus.error}`}
                      </p>
                    </div>
                    {!isProcessing && fileWithStatus.status === 'pending' && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            <p className="text-xs text-muted-foreground">
              Formatos aceitos: PDF, JPEG, PNG, WEBP (máx. 10MB cada). Você pode selecionar múltiplos arquivos.
            </p>
          </div>

          {/* Progresso */}
          {isProcessing && (
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md p-3">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                <Loader2 className="inline h-4 w-4 animate-spin mr-2" />
                Processando arquivo {currentFileIndex + 1} de {files.length}...
              </p>
            </div>
          )}

          {/* Aviso */}
          {!isProcessing && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-blue-800">
                  A IA preencherá automaticamente os campos do ultrassom selecionado com base nos laudos fornecidos.
                  Os resultados de múltiplos arquivos serão mesclados.
                </p>
              </div>
            </div>
          )}

          {/* Erro */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
        </div>

        {/* Botões */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleClose} disabled={isProcessing}>
            Cancelar
          </Button>
          <Button
            onClick={handleInterpretar}
            disabled={files.length === 0 || !tipoSelecionado || isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Interpretar {files.length > 0 ? `${files.length} Arquivo${files.length > 1 ? 's' : ''}` : 'Laudo'}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
