import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Upload, FileText, Image, Loader2, X, CheckCircle, Minimize2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { compressImage, formatFileSize, calculateReduction } from "@/lib/imageCompression";

interface InterpretarExamesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResultados: (resultados: Record<string, string>, trimestre: string, dataColeta?: string) => void;
}

interface FileWithStatus {
  file: File;
  originalFile?: File;
  status: 'pending' | 'compressing' | 'processing' | 'success' | 'error';
  error?: string;
  wasCompressed?: boolean;
  originalSize?: number;
  compressedSize?: number;
}

export function InterpretarExamesModal({ open, onOpenChange, onResultados }: InterpretarExamesModalProps) {
  const [files, setFiles] = useState<FileWithStatus[]>([]);
  const [trimestre, setTrimestre] = useState<"primeiro" | "segundo" | "terceiro">("primeiro");
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [allResultados, setAllResultados] = useState<Record<string, string>>({});
  const [lastDataColeta, setLastDataColeta] = useState<string | undefined>();
  const [isDragging, setIsDragging] = useState(false);

  const interpretarMutation = trpc.examesLab.interpretarComIA.useMutation();

  const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  const validateAndAddFiles = (selectedFiles: File[]) => {
    const validFiles: FileWithStatus[] = [];
    
    for (const file of selectedFiles) {
      // Validar tipo de arquivo
      if (!validTypes.includes(file.type)) {
        toast.error(`${file.name}: Tipo inválido. Aceito: PDF, JPEG, PNG, WEBP`);
        continue;
      }
      
      // Validar tamanho (máximo 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name}: Arquivo muito grande. Máximo: 10MB`);
        continue;
      }
      
      validFiles.push({ file, status: 'pending' });
    }
    
    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isProcessing) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (isProcessing) return;
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    validateAndAddFiles(droppedFiles);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    validateAndAddFiles(selectedFiles);
    // Limpar input para permitir selecionar os mesmos arquivos novamente
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const processFile = async (fileWithStatus: FileWithStatus, index: number): Promise<Record<string, string>> => {
    let fileToProcess = fileWithStatus.file;
    
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
        
        fileToProcess = compressionResult.file;
        
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
    
    // 2. Atualizar status para processing
    setFiles(prev => prev.map((f, i) => 
      i === index ? { ...f, status: 'processing' } : f
    ));
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const base64 = e.target?.result as string;
          const base64Data = base64.split(',')[1];

          const result = await interpretarMutation.mutateAsync({
            fileBase64: base64Data,
            mimeType: fileToProcess.type,
            trimestre,
          });

          // Atualizar status do arquivo
          setFiles(prev => prev.map((f, i) => 
            i === index ? { ...f, status: 'success' } : f
          ));

          // Guardar data de coleta se encontrada
          if (result.dataColeta) {
            setLastDataColeta(result.dataColeta);
          }

          resolve(result.resultados);
        } catch (error: any) {
          setFiles(prev => prev.map((f, i) => 
            i === index ? { ...f, status: 'error', error: error.message } : f
          ));
          reject(error);
        }
      };
      reader.onerror = () => {
        setFiles(prev => prev.map((f, i) => 
          i === index ? { ...f, status: 'error', error: 'Erro ao ler arquivo' } : f
        ));
        reject(new Error('Erro ao ler arquivo'));
      };
      reader.readAsDataURL(fileWithStatus.file);
    });
  };

  const handleSubmit = async () => {
    if (files.length === 0) {
      toast.error('Selecione pelo menos um arquivo');
      return;
    }

    setIsProcessing(true);
    setCurrentFileIndex(0);
    
    let combinedResultados: Record<string, string> = {};
    let successCount = 0;
    let errorCount = 0;

    // Marcar todos como processing
    setFiles(prev => prev.map(f => ({ ...f, status: 'processing' as const })));

    for (let i = 0; i < files.length; i++) {
      setCurrentFileIndex(i);
      
      // Marcar arquivo atual como processing
      setFiles(prev => prev.map((f, idx) => 
        idx === i ? { ...f, status: 'processing' } : f
      ));

      try {
        const resultados = await processFile(files[i], i);
        // Mesclar resultados (valores posteriores sobrescrevem anteriores)
        combinedResultados = { ...combinedResultados, ...resultados };
        successCount++;
      } catch (error) {
        errorCount++;
        console.error(`Erro ao processar ${files[i].file.name}:`, error);
      }
    }

    setIsProcessing(false);

    if (successCount > 0) {
      const totalExames = Object.keys(combinedResultados).length;
      const mensagem = lastDataColeta 
        ? `${totalExames} exames extraídos de ${successCount} arquivo(s) (Data: ${lastDataColeta})!`
        : `${totalExames} exames extraídos de ${successCount} arquivo(s)!`;
      
      if (errorCount > 0) {
        toast.warning(`${mensagem} (${errorCount} arquivo(s) com erro)`);
      } else {
        toast.success(mensagem);
      }
      
      onResultados(combinedResultados, trimestre, lastDataColeta);
      
      // Aguardar um pouco para mostrar os status antes de fechar
      setTimeout(() => {
        handleClose();
      }, 1500);
    } else {
      toast.error('Nenhum arquivo foi processado com sucesso');
    }
  };

  const handleClose = () => {
    setFiles([]);
    setTrimestre("primeiro");
    setIsProcessing(false);
    setCurrentFileIndex(0);
    setAllResultados({});
    setLastDataColeta(undefined);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Interpretar Exames com IA</DialogTitle>
          <DialogDescription>
            Faça upload de um ou mais arquivos (PDF ou fotos) dos exames laboratoriais. A IA irá extrair automaticamente os valores e preencher os campos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Seleção de Trimestre */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Trimestre dos Exames</Label>
            <RadioGroup value={trimestre} onValueChange={(value) => setTrimestre(value as typeof trimestre)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="primeiro" id="primeiro" />
                <Label htmlFor="primeiro" className="font-normal cursor-pointer">
                  1º Trimestre (até 13 semanas)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="segundo" id="segundo" />
                <Label htmlFor="segundo" className="font-normal cursor-pointer">
                  2º Trimestre (14 a 27 semanas)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="terceiro" id="terceiro" />
                <Label htmlFor="terceiro" className="font-normal cursor-pointer">
                  3º Trimestre (28 a 40 semanas)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Upload de Arquivos */}
          <div className="space-y-3">
            <Label htmlFor="file-upload" className="text-base font-semibold">
              Arquivos dos Exames
            </Label>
            
            {/* Zona de Drag-and-Drop */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !isProcessing && document.getElementById('file-upload')?.click()}
              className={`
                border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all
                ${isDragging 
                  ? 'border-primary bg-primary/10 scale-[1.02]' 
                  : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
                }
                ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <Upload className={`mx-auto h-8 w-8 mb-2 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
              <p className="text-sm font-medium">
                {isDragging ? 'Solte os arquivos aqui' : 'Arraste arquivos ou clique para selecionar'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                PDF, JPEG, PNG, WEBP (máx. 10MB cada)
              </p>
              {files.length > 0 && (
                <p className="text-xs text-primary mt-2 font-medium">
                  {files.length} arquivo(s) selecionado(s)
                </p>
              )}
            </div>
            
            <input
              id="file-upload"
              type="file"
              accept=".pdf,image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleFileChange}
              className="hidden"
              multiple
            />
            
            {/* Lista de arquivos selecionados */}
            {files.length > 0 && (
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {files.map((fileWithStatus, index) => (
                  <div 
                    key={index} 
                    className={`flex items-center gap-2 p-3 rounded-md ${
                      fileWithStatus.status === 'success' ? 'bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800' :
                      fileWithStatus.status === 'error' ? 'bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800' :
                      (fileWithStatus.status === 'processing' || fileWithStatus.status === 'compressing') ? 'bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800' :
                      'bg-muted'
                    }`}
                  >
                    {(fileWithStatus.status === 'processing' || fileWithStatus.status === 'compressing') ? (
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
                        {fileWithStatus.status === 'processing' && ' - Processando...'}
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
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md p-3">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                <strong>Nota:</strong> A IA irá preencher automaticamente todos os campos de exames, 
                <strong> exceto o campo "Observações / Outros Exames"</strong>, que permanece exclusivo para digitação manual.
                Os resultados de múltiplos arquivos serão mesclados.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isProcessing}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={files.length === 0 || isProcessing}>
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Interpretar {files.length > 0 ? `${files.length} Arquivo${files.length > 1 ? 's' : ''}` : 'Exames'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
