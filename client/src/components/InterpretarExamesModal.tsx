import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileText, Image, Loader2, X, CheckCircle, Minimize2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { compressImage, formatFileSize, calculateReduction } from "@/lib/imageCompression";

interface InterpretarExamesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResultados: (resultados: Record<string, string>, trimestre: string, dataColeta?: string, arquivosProcessados?: number, modoAutomatico?: boolean) => void;
  dumGestante?: Date | null;
}

interface FileWithStatus {
  file: File;
  originalFile?: File;
  status: 'pending' | 'compressing' | 'processing' | 'success' | 'error';
  error?: string;
  wasCompressed?: boolean;
  originalSize?: number;
  compressedSize?: number;
  previewUrl?: string; // URL para preview de imagens
}

export function InterpretarExamesModal({ open, onOpenChange, onResultados, dumGestante }: InterpretarExamesModalProps) {
  const [files, setFiles] = useState<FileWithStatus[]>([]);
  const [trimestre, setTrimestre] = useState<"primeiro" | "segundo" | "terceiro">("primeiro");
  const [dataColeta, setDataColeta] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [allResultados, setAllResultados] = useState<Record<string, string>>({});
  const [lastDataColeta, setLastDataColeta] = useState<string | undefined>();
  const [isDragging, setIsDragging] = useState(false);
  const [alertaCoerencia, setAlertaCoerencia] = useState<string | null>(null);
  const [confirmarContinuar, setConfirmarContinuar] = useState(false);
  const [modoAutomatico, setModoAutomatico] = useState(true); // Novo: modo automático por padrão

  const interpretarMutation = trpc.examesLab.interpretarComIA.useMutation();

  // Garantir que o trimestre seja definido quando o modo manual é ativado
  useEffect(() => {
    if (!modoAutomatico && trimestre !== "primeiro" && trimestre !== "segundo" && trimestre !== "terceiro") {
      setTrimestre("primeiro");
    }
  }, [modoAutomatico, trimestre]);

  // Função para calcular trimestre esperado baseado na DUM
  const calcularTrimestreEsperado = (dataColeta: string, dum: Date): number | null => {
    const data = new Date(dataColeta);
    const diffMs = data.getTime() - dum.getTime();
    const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const semanas = Math.floor(diffDias / 7);
    
    if (semanas <= 13) return 1;
    if (semanas <= 27) return 2;
    if (semanas <= 40) return 3;
    return null;
  };

  // Validar coerência quando data ou trimestre mudam
  useEffect(() => {
    if (dataColeta && dumGestante) {
      const trimestreEsperado = calcularTrimestreEsperado(dataColeta, dumGestante);
      const trimestreNum = trimestre === "primeiro" ? 1 : trimestre === "segundo" ? 2 : 3;
      
      if (trimestreEsperado && trimestreEsperado !== trimestreNum) {
        setAlertaCoerencia(
          `Atenção: Baseado na DUM da gestante, a data ${dataColeta} corresponde ao ${trimestreEsperado}º trimestre, mas você selecionou ${trimestreNum}º trimestre.`
        );
        setConfirmarContinuar(false);
      } else {
        setAlertaCoerencia(null);
        setConfirmarContinuar(false);
      }
    } else {
      setAlertaCoerencia(null);
      setConfirmarContinuar(false);
    }
  }, [dataColeta, trimestre, dumGestante]);

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
      
      // Gerar preview URL para imagens
      let previewUrl: string | undefined;
      if (file.type.startsWith('image/')) {
        previewUrl = URL.createObjectURL(file);
      }
      
      validFiles.push({ file, status: 'pending', previewUrl });
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
    // Revogar URL de preview para liberar memória
    const fileToRemove = files[index];
    if (fileToRemove?.previewUrl) {
      URL.revokeObjectURL(fileToRemove.previewUrl);
    }
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
            trimestre: modoAutomatico ? undefined : trimestre, // Só envia trimestre se modo manual
            dumGestante: modoAutomatico && dumGestante && !isNaN(dumGestante.getTime()) ? dumGestante.toISOString().split('T')[0] : undefined, // Envia DUM se modo automático
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

  const handleInterpretarTodos = async () => {
    console.log('[DEBUG] handleInterpretarTodos chamado');
    console.log('[DEBUG] files.length:', files.length);
    console.log('[DEBUG] modoAutomatico:', modoAutomatico);
    console.log('[DEBUG] dataColeta:', dataColeta);
    console.log('[DEBUG] trimestre:', trimestre);
    console.log('[DEBUG] alertaCoerencia:', alertaCoerencia);
    console.log('[DEBUG] confirmarContinuar:', confirmarContinuar);
    
    if (files.length === 0) {
      toast.error('Nenhum arquivo selecionado');
      return;
    }

    // Validar data de coleta apenas se modo manual
    if (!modoAutomatico && !dataColeta) {
      toast.error('Por favor, informe a data de coleta dos exames');
      return;
    }

    // Validar confirmação se houver alerta de coerência (apenas modo manual)
    // TEMPORARIAMENTE DESABILITADO PARA DEBUG
    // if (!modoAutomatico && alertaCoerencia && !confirmarContinuar) {
    //   toast.error('Por favor, confirme que deseja continuar mesmo com o alerta de coerência');
    //   return;
    // }

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
      
      // Se modo automático, usar data extraída pela IA; se manual, usar data informada pelo usuário
      const dataFinal = modoAutomatico ? lastDataColeta : dataColeta;
      onResultados(combinedResultados, trimestre, dataFinal, successCount, modoAutomatico);
      
      // Aguardar um pouco para mostrar os status antes de fechar
      setTimeout(() => {
        handleClose();
      }, 1500);
    } else {
      toast.error('Nenhum arquivo foi processado com sucesso');
    }
  };

  const handleClose = () => {
    // Revogar todas as URLs de preview para liberar memória
    files.forEach(f => {
      if (f.previewUrl) {
        URL.revokeObjectURL(f.previewUrl);
      }
    });
    setFiles([]);
    setTrimestre("primeiro");
    setDataColeta("");
    setIsProcessing(false);
    setCurrentFileIndex(0);
    setAllResultados({});
    setLastDataColeta(undefined);
    setAlertaCoerencia(null);
    setConfirmarContinuar(false);
    setModoAutomatico(true); // Reset para modo automático
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen && !isProcessing) handleClose(); }}>
      <DialogContent className="sm:max-w-[550px] max-h-[80vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>Interpretar Exames com IA</DialogTitle>
          <DialogDescription>
            Faça upload de um ou mais arquivos (PDF ou fotos) dos exames laboratoriais. A IA irá extrair automaticamente os valores e preencher os campos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 overflow-y-auto flex-1 min-h-0">
          {/* Toggle Modo Automático */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-semibold text-blue-900">Modo Automático</Label>
                <p className="text-sm text-blue-700 mt-1">
                  {modoAutomatico 
                    ? "A IA irá extrair automaticamente a data e o trimestre de cada exame do arquivo."
                    : "Você precisa informar manualmente a data e o trimestre dos exames."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModoAutomatico(!modoAutomatico)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  modoAutomatico ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    modoAutomatico ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Data de Coleta - apenas modo manual */}
          {!modoAutomatico && (
            <div className="space-y-3">
              <Label htmlFor="data-coleta" className="text-base font-semibold">
                Data de Coleta <span className="text-destructive">*</span>
              </Label>
              <input
                id="data-coleta"
                type="date"
                value={dataColeta}
                onChange={(e) => setDataColeta(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
              />
            </div>
          )}

          {/* Seleção de Trimestre - apenas modo manual */}
          {!modoAutomatico && (
            <div className="space-y-3">
              <Label className="text-base font-semibold">
                Trimestre dos Exames <span className="text-destructive">*</span>
              </Label>
              <Select value={trimestre} onValueChange={(value) => setTrimestre(value as typeof trimestre)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione o trimestre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="primeiro">1º Trimestre (até 13 semanas)</SelectItem>
                  <SelectItem value="segundo">2º Trimestre (14 a 27 semanas)</SelectItem>
                  <SelectItem value="terceiro">3º Trimestre (28 a 40 semanas)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Alerta de Coerência - apenas modo manual */}
          {!modoAutomatico && alertaCoerencia && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-800">{alertaCoerencia}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="confirmar-continuar"
                  checked={confirmarContinuar}
                  onChange={(e) => setConfirmarContinuar(e.target.checked)}
                  className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
                />
                <Label htmlFor="confirmar-continuar" className="text-sm text-yellow-800 cursor-pointer">
                  Confirmo que desejo continuar mesmo assim
                </Label>
              </div>
            </div>
          )}

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
                border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all
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
              <div className="space-y-2 max-h-[150px] overflow-y-auto">
                {files.map((fileWithStatus, index) => (
                  <div 
                    key={index} 
                    className={`flex items-center gap-3 p-3 rounded-md ${
                      fileWithStatus.status === 'success' ? 'bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800' :
                      fileWithStatus.status === 'error' ? 'bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800' :
                      (fileWithStatus.status === 'processing' || fileWithStatus.status === 'compressing') ? 'bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800' :
                      'bg-muted'
                    }`}
                  >
                    {/* Preview de imagem ou ícone */}
                    {fileWithStatus.previewUrl ? (
                      <div className="relative flex-shrink-0">
                        <img 
                          src={fileWithStatus.previewUrl} 
                          alt={fileWithStatus.file.name}
                          className="h-14 w-14 object-cover rounded-md border border-border"
                        />
                        {(fileWithStatus.status === 'processing' || fileWithStatus.status === 'compressing') && (
                          <div className="absolute inset-0 bg-black/50 rounded-md flex items-center justify-center">
                            <Loader2 className="h-5 w-5 text-white animate-spin" />
                          </div>
                        )}
                        {fileWithStatus.status === 'success' && (
                          <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-0.5">
                            <CheckCircle className="h-3 w-3 text-white" />
                          </div>
                        )}
                        {fileWithStatus.status === 'error' && (
                          <div className="absolute -top-1 -right-1 bg-red-500 rounded-full p-0.5">
                            <X className="h-3 w-3 text-white" />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="h-14 w-14 flex-shrink-0 flex items-center justify-center bg-muted rounded-md border border-border">
                        {(fileWithStatus.status === 'processing' || fileWithStatus.status === 'compressing') ? (
                          <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
                        ) : fileWithStatus.status === 'success' ? (
                          <CheckCircle className="h-6 w-6 text-green-500" />
                        ) : fileWithStatus.status === 'error' ? (
                          <X className="h-6 w-6 text-red-500" />
                        ) : (
                          <FileText className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
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
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md p-2">
              <p className="text-xs text-blue-900 dark:text-blue-100">
                <strong>Nota:</strong> A IA irá preencher automaticamente todos os campos de exames, 
                <strong> exceto o campo "Observações / Outros Exames"</strong>, que permanece exclusivo para digitação manual.
                Os resultados de múltiplos arquivos serão mesclados.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex-shrink-0 pt-2 border-t">
          <Button variant="outline" onClick={handleClose} disabled={isProcessing}>
            Cancelar
          </Button>
          <Button 
            type="button" 
            onClick={handleInterpretarTodos}
            disabled={files.length === 0 || isProcessing}
          >
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
