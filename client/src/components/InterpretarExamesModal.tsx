import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileText, Image, Loader2, X, CheckCircle, Minimize2, AlertTriangle, Info, ChevronDown, ChevronUp, Lock, Unlock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { compressImage, formatFileSize, calculateReduction } from "@/lib/imageCompression";

interface InterpretarExamesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResultados: (resultados: Record<string, string>, trimestre: string, dataColeta?: string, arquivosProcessados?: number, modoAutomatico?: boolean) => void;
  dumGestante?: Date | null;
  dppUltrassom?: Date | null; // DPP pelo Ultrassom como alternativa quando DUM não está disponível
  gestanteId?: number; // ID da gestante para salvar arquivos
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

export function InterpretarExamesModal({ open, onOpenChange, onResultados, dumGestante, dppUltrassom, gestanteId }: InterpretarExamesModalProps) {
  // Calcular DUM estimada a partir da DPP pelo Ultrassom se DUM não estiver disponível
  // DUM estimada = DPP - 280 dias
  const dumEfetiva = dumGestante || (dppUltrassom ? new Date(dppUltrassom.getTime() - 280 * 24 * 60 * 60 * 1000) : null);
  
  // Debug: verificar valores recebidos
  useEffect(() => {
    console.log('[DEBUG InterpretarExamesModal] Props recebidas:');
    console.log('  dumGestante:', dumGestante);
    console.log('  dppUltrassom:', dppUltrassom);
    console.log('  dumEfetiva calculada:', dumEfetiva);
  }, [dumGestante, dppUltrassom, dumEfetiva]);
  const [files, setFiles] = useState<FileWithStatus[]>([]);
  const [trimestre, setTrimestre] = useState<"primeiro" | "segundo" | "terceiro">("primeiro");
  const [dataColeta, setDataColeta] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [allResultados, setAllResultados] = useState<Record<string, string>>({});
  const [lastDataColeta, setLastDataColeta] = useState<string | undefined>();
  const [isDragging, setIsDragging] = useState(false);
  const [alertaCoerencia, setAlertaCoerencia] = useState<string | null>(null);
  const [modoAutomatico, setModoAutomatico] = useState(true); // Novo: modo automático por padrão
  const [relatorioExtracao, setRelatorioExtracao] = useState<{
    examesEncontrados: { nome: string; valor: string; dataColeta?: string; trimestre?: number }[];
    examesNaoPresentes?: string[]; // Novo: exames não presentes no PDF
    examesNaoEncontrados?: string[]; // Legado: manter compatibilidade
    estatisticas: { 
      totalEncontradosNoPDF?: number;
      totalCadastrados?: number;
      totalEsperado: number; 
      totalEncontrado: number; 
      taxaSucesso: number 
    };
    avisos: string[];
  } | null>(null);
  const [mostrarDetalhesRelatorio, setMostrarDetalhesRelatorio] = useState(false);
  
  // Estados para PDF protegido por senha
  const [pdfProtegido, setPdfProtegido] = useState(false);
  const [senhaPdf, setSenhaPdf] = useState("");
  const [verificandoPdf, setVerificandoPdf] = useState(false);
  const [desbloqueandoPdf, setDesbloqueandoPdf] = useState(false);
  const [erroSenha, setErroSenha] = useState<string | null>(null);
  const [pdfDesbloqueado, setPdfDesbloqueado] = useState<{ base64: string; index: number } | null>(null);

  const interpretarMutation = trpc.examesLab.interpretarComIA.useMutation();
  const verificarPdfMutation = trpc.examesLab.verificarPdfProtegido.useMutation();
  const desbloquearPdfMutation = trpc.examesLab.desbloquearPdf.useMutation();
  const uploadArquivoMutation = trpc.examesLab.uploadArquivo.useMutation();

  // Funções de cache para PDFs desbloqueados
  const getPdfCacheKey = (file: File) => `pdf_unlocked_${file.name}_${file.size}`;
  
  const getCachedPdf = (file: File): string | null => {
    try {
      const key = getPdfCacheKey(file);
      return sessionStorage.getItem(key);
    } catch {
      return null;
    }
  };
  
  const setCachedPdf = (file: File, base64: string) => {
    try {
      const key = getPdfCacheKey(file);
      sessionStorage.setItem(key, base64);
    } catch (e) {
      console.warn('Erro ao salvar PDF no cache:', e);
    }
  };

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
    if (dataColeta && dumEfetiva) {
      const trimestreEsperado = calcularTrimestreEsperado(dataColeta, dumEfetiva);
      const trimestreNum = trimestre === "primeiro" ? 1 : trimestre === "segundo" ? 2 : 3;
      
      if (trimestreEsperado && trimestreEsperado !== trimestreNum) {
        setAlertaCoerencia(
          `Atenção: Baseado na DUM da gestante, a data ${dataColeta} corresponde ao ${trimestreEsperado}º trimestre, mas você selecionou ${trimestreNum}º trimestre.`
        );
      } else {
        setAlertaCoerencia(null);
      }
    } else {
      setAlertaCoerencia(null);
    }
  }, [dataColeta, trimestre, dumEfetiva]);

  const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  const validateAndAddFiles = async (selectedFiles: File[]) => {
    const validFiles: FileWithStatus[] = [];
    
    // Resetar estados de PDF protegido
    setPdfProtegido(false);
    setSenhaPdf("");
    setErroSenha(null);
    setPdfDesbloqueado(null);
    
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
      
      // Verificar se PDF está protegido por senha
      if (file.type === 'application/pdf') {
        // Verificar cache primeiro
        const cachedBase64 = getCachedPdf(file);
        if (cachedBase64) {
          // PDF já foi desbloqueado anteriormente
          const pdfIndex = validFiles.length;
          setPdfDesbloqueado({ base64: cachedBase64, index: pdfIndex });
          toast.success(`${file.name}: PDF carregado do cache (já desbloqueado)`);
          validFiles.push({ file, status: 'pending', previewUrl: undefined });
          continue;
        }
        
        setVerificandoPdf(true);
        try {
          const reader = new FileReader();
          const base64 = await new Promise<string>((resolve, reject) => {
            reader.onload = (e) => resolve((e.target?.result as string).split(',')[1]);
            reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
            reader.readAsDataURL(file);
          });
          
          const checkResult = await verificarPdfMutation.mutateAsync({
            fileBase64: base64,
            mimeType: file.type,
          });
          
          if (checkResult.needsPassword) {
            setPdfProtegido(true);
            // Adicionar arquivo como pending mas marcar que precisa de senha
            validFiles.push({ file, status: 'pending', previewUrl: undefined });
            toast.info(`${file.name}: PDF protegido por senha. Digite a senha para continuar.`);
            setVerificandoPdf(false);
            // Adicionar arquivos válidos até agora e parar
            if (validFiles.length > 0) {
              setFiles(prev => [...prev, ...validFiles]);
            }
            return; // Parar aqui e aguardar senha
          }
        } catch (error) {
          console.error('Erro ao verificar PDF:', error);
          // Continuar mesmo com erro na verificação
        } finally {
          setVerificandoPdf(false);
        }
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

  const processFile = async (fileWithStatus: FileWithStatus, index: number): Promise<{ resultados: Record<string, string>; relatorio?: typeof relatorioExtracao }> => {
    let fileToProcess = fileWithStatus.file;
    let base64ToUse: string | null = null;
    
    // Verificar se temos um PDF desbloqueado para este índice
    if (pdfDesbloqueado && pdfDesbloqueado.index === index) {
      base64ToUse = pdfDesbloqueado.base64;
    }
    
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
    
    // Se já temos o base64 do PDF desbloqueado, usar diretamente
    if (base64ToUse) {
      try {
        const result = await interpretarMutation.mutateAsync({
          fileBase64: base64ToUse,
          mimeType: 'application/pdf',
          trimestre: modoAutomatico ? undefined : trimestre,
          dumGestante: modoAutomatico && dumEfetiva && !isNaN(dumEfetiva.getTime()) ? dumEfetiva.toISOString().split('T')[0] : undefined,
        });

        setFiles(prev => prev.map((f, i) => 
          i === index ? { ...f, status: 'success' } : f
        ));

        if (result.dataColeta) {
          setLastDataColeta(result.dataColeta);
        }

        return { resultados: result.resultados, relatorio: result.relatorio };
      } catch (error: any) {
        setFiles(prev => prev.map((f, i) => 
          i === index ? { ...f, status: 'error', error: error.message } : f
        ));
        throw error;
      }
    }
    
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
            dumGestante: modoAutomatico && dumEfetiva && !isNaN(dumEfetiva.getTime()) ? dumEfetiva.toISOString().split('T')[0] : undefined, // Envia DUM (ou DUM estimada pela DPP) se modo automático
          });

          // Atualizar status do arquivo
          setFiles(prev => prev.map((f, i) => 
            i === index ? { ...f, status: 'success' } : f
          ));

          // Guardar data de coleta se encontrada
          if (result.dataColeta) {
            setLastDataColeta(result.dataColeta);
          }

          resolve({ resultados: result.resultados, relatorio: result.relatorio });
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
    
    if (files.length === 0) {
      toast.error('Nenhum arquivo selecionado');
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
        const { resultados, relatorio } = await processFile(files[i], i);
        // Mesclar resultados (valores posteriores sobrescrevem anteriores)
        combinedResultados = { ...combinedResultados, ...resultados };
        // Guardar o último relatório de extração
        if (relatorio) {
          setRelatorioExtracao(relatorio);
        }
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
      
      // Salvar arquivos processados no S3 (se gestanteId fornecido)
      if (gestanteId) {
        for (let i = 0; i < files.length; i++) {
          const fileWithStatus = files[i];
          if (fileWithStatus.status === 'success') {
            try {
              // Ler arquivo como base64
              const reader = new FileReader();
              const fileBase64 = await new Promise<string>((resolve, reject) => {
                reader.onload = (e) => resolve((e.target?.result as string).split(',')[1]);
                reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
                reader.readAsDataURL(fileWithStatus.file);
              });
              
              // Determinar trimestre numérico
              const trimestreNum = trimestre === 'primeiro' ? 1 : trimestre === 'segundo' ? 2 : 3;
              
              // Upload do arquivo
              await uploadArquivoMutation.mutateAsync({
                gestanteId,
                nomeArquivo: fileWithStatus.file.name,
                tipoArquivo: fileWithStatus.file.type,
                tamanhoBytes: fileWithStatus.file.size,
                fileBase64,
                senhaPdf: senhaPdf || undefined, // Salvar senha se foi fornecida
                protegidoPorSenha: pdfDesbloqueado !== null || senhaPdf.length > 0,
                trimestre: trimestreNum,
                dataColeta: lastDataColeta || undefined,
              });
              
              console.log(`[DEBUG] Arquivo ${fileWithStatus.file.name} salvo com sucesso`);
            } catch (uploadError) {
              console.error(`Erro ao salvar arquivo ${fileWithStatus.file.name}:`, uploadError);
              // Não interromper o fluxo por erro de upload
            }
          }
        }
        toast.info('Arquivos salvos para consulta futura');
      }
      
      // Sempre usar data extraída pela IA (tanto modo automático quanto manual)
      onResultados(combinedResultados, trimestre, lastDataColeta, successCount, modoAutomatico);
      
      // Não fechar automaticamente - deixar o usuário ver o relatório de extração
      // O usuário pode fechar manualmente clicando em "Fechar" ou "X"
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
    setModoAutomatico(true); // Reset para modo automático
    setRelatorioExtracao(null); // Reset do relatório
    setMostrarDetalhesRelatorio(false); // Reset dos detalhes
    // Reset estados de PDF protegido
    setPdfProtegido(false);
    setSenhaPdf("");
    setErroSenha(null);
    setPdfDesbloqueado(null);
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

          {/* Seleção de Trimestre - apenas modo manual */}
          {!modoAutomatico && (
            <div className="space-y-3">
              <Label className="text-base font-semibold">
                Coluna do Trimestre para Registro <span className="text-destructive">*</span>
              </Label>
              <p className="text-sm text-muted-foreground">
                Escolha em qual coluna os exames serão registrados. A data será extraída automaticamente pela IA.
              </p>
              <Select value={trimestre} onValueChange={(value) => setTrimestre(value as typeof trimestre)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione o trimestre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="primeiro">1º Trimestre</SelectItem>
                  <SelectItem value="segundo">2º Trimestre</SelectItem>
                  <SelectItem value="terceiro">3º Trimestre</SelectItem>
                </SelectContent>
              </Select>
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
            
            {/* Aviso de verificação de PDF */}
            {verificandoPdf && (
              <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                <span className="text-sm text-blue-700">Verificando PDF...</span>
              </div>
            )}
            
            {/* Campo de senha para PDF protegido */}
            {pdfProtegido && files.length > 0 && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg space-y-3">
                <div className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-amber-600" />
                  <span className="font-medium text-amber-800">PDF Protegido por Senha</span>
                </div>
                <p className="text-sm text-amber-700">
                  Este PDF está protegido. Digite a senha para desbloqueá-lo e continuar.
                </p>
                <div className="flex gap-2">
                  <Input
                    type="password"
                    placeholder="Digite a senha do PDF"
                    value={senhaPdf}
                    onChange={(e) => {
                      setSenhaPdf(e.target.value);
                      setErroSenha(null);
                    }}
                    className="flex-1"
                    disabled={desbloqueandoPdf}
                  />
                  <Button
                    onClick={async () => {
                      if (!senhaPdf.trim()) {
                        setErroSenha('Digite a senha');
                        return;
                      }
                      
                      setDesbloqueandoPdf(true);
                      setErroSenha(null);
                      
                      try {
                        // Ler o arquivo PDF
                        const pdfFile = files.find(f => f.file.type === 'application/pdf');
                        if (!pdfFile) return;
                        
                        const reader = new FileReader();
                        const base64 = await new Promise<string>((resolve, reject) => {
                          reader.onload = (e) => resolve((e.target?.result as string).split(',')[1]);
                          reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
                          reader.readAsDataURL(pdfFile.file);
                        });
                        
                        const result = await desbloquearPdfMutation.mutateAsync({
                          fileBase64: base64,
                          password: senhaPdf,
                        });
                        
                        if (result.success && result.unlockedBase64) {
                          // Guardar o PDF desbloqueado
                          const pdfIndex = files.findIndex(f => f.file.type === 'application/pdf');
                          setPdfDesbloqueado({ base64: result.unlockedBase64, index: pdfIndex });
                          setPdfProtegido(false);
                          
                          // Salvar no cache para não pedir senha novamente
                          if (pdfFile) {
                            setCachedPdf(pdfFile.file, result.unlockedBase64);
                          }
                          
                          toast.success('PDF desbloqueado com sucesso!');
                        } else {
                          setErroSenha(result.error || 'Senha incorreta');
                        }
                      } catch (error: any) {
                        setErroSenha(error.message || 'Erro ao desbloquear PDF');
                      } finally {
                        setDesbloqueandoPdf(false);
                      }
                    }}
                    disabled={desbloqueandoPdf || !senhaPdf.trim()}
                    size="sm"
                  >
                    {desbloqueandoPdf ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <><Unlock className="h-4 w-4 mr-1" /> Desbloquear</>
                    )}
                  </Button>
                </div>
                {erroSenha && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" />
                    {erroSenha}
                  </p>
                )}
              </div>
            )}
            
            {/* Indicador de PDF desbloqueado */}
            {pdfDesbloqueado && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <Unlock className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-700">PDF desbloqueado e pronto para interpretação</span>
              </div>
            )}
            
            {/* Lista de arquivos selecionados */}
            {files.length > 0 && (
              <div className="space-y-2 max-h-[150px] overflow-y-auto">
                {files.map((fileWithStatus, index) => (
                  <div 
                    key={index} 
                    className={`relative flex items-center gap-3 p-3 rounded-md ${
                      fileWithStatus.status === 'success' ? 'bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800' :
                      fileWithStatus.status === 'error' ? 'bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800' :
                      (fileWithStatus.status === 'processing' || fileWithStatus.status === 'compressing') ? 'bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800' :
                      'bg-muted'
                    }`}
                  >
                    {/* Indicador de PDF desbloqueado */}
                    {fileWithStatus.file.type === 'application/pdf' && pdfDesbloqueado && pdfDesbloqueado.index === index && (
                      <div className="absolute -top-1 -left-1 bg-green-500 rounded-full p-0.5 z-10" title="PDF desbloqueado">
                        <Unlock className="h-3 w-3 text-white" />
                      </div>
                    )}
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
          {!isProcessing && !relatorioExtracao && (
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md p-2">
              <p className="text-xs text-blue-900 dark:text-blue-100">
                <strong>Nota:</strong> A IA irá preencher automaticamente todos os campos de exames, 
                <strong> exceto o campo "Observações / Outros Exames"</strong>, que permanece exclusivo para digitação manual.
                Os resultados de múltiplos arquivos serão mesclados.
              </p>
            </div>
          )}

          {/* Relatório de Extração */}
          {relatorioExtracao && !isProcessing && (() => {
            // Usar novos campos se disponíveis, senão fallback para legados
            const totalNoPDF = relatorioExtracao.estatisticas.totalEncontradosNoPDF ?? relatorioExtracao.estatisticas.totalEncontrado;
            const totalCadastrados = relatorioExtracao.estatisticas.totalCadastrados ?? relatorioExtracao.estatisticas.totalEncontrado;
            const todosCadastrados = totalCadastrados === totalNoPDF;
            const examesNaoPresentes = relatorioExtracao.examesNaoPresentes ?? relatorioExtracao.examesNaoEncontrados ?? [];
            
            return (
            <div className="space-y-3">
              {/* Estatísticas - baseadas no que foi encontrado no PDF */}
              <div className={`rounded-md p-3 border ${
                todosCadastrados 
                  ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800' 
                  : totalNoPDF > 0
                    ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800'
                    : 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {todosCadastrados ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : totalNoPDF > 0 ? (
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                    )}
                    <span className="font-semibold text-sm">
                      {totalNoPDF} {totalNoPDF === 1 ? 'exame encontrado' : 'exames encontrados'} no PDF
                    </span>
                  </div>
                  <span className={`text-sm font-medium px-2 py-1 rounded ${
                    todosCadastrados 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {totalCadastrados}/{totalNoPDF} cadastrados
                  </span>
                </div>
                {todosCadastrados && totalNoPDF > 0 && (
                  <p className="text-xs text-green-700 mt-1">
                    Todos os exames presentes no PDF foram cadastrados com sucesso.
                  </p>
                )}
                {!todosCadastrados && totalNoPDF > 0 && (
                  <p className="text-xs text-yellow-700 mt-1">
                    {totalNoPDF - totalCadastrados} {totalNoPDF - totalCadastrados === 1 ? 'exame não pôde ser cadastrado' : 'exames não puderam ser cadastrados'} (valor vazio ou inválido).
                  </p>
                )}
              </div>

              {/* Avisos */}
              {relatorioExtracao.avisos.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 dark:bg-amber-950 dark:border-amber-800 rounded-md p-3">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div className="space-y-1">
                      {relatorioExtracao.avisos.map((aviso, index) => (
                        <p key={index} className="text-xs text-amber-800 dark:text-amber-200">
                          {aviso}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Botão para expandir/colapsar detalhes */}
              {(relatorioExtracao.examesEncontrados.length > 0 || examesNaoPresentes.length > 0) && (
                <button
                  type="button"
                  onClick={() => setMostrarDetalhesRelatorio(!mostrarDetalhesRelatorio)}
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {mostrarDetalhesRelatorio ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                  {mostrarDetalhesRelatorio ? 'Ocultar detalhes' : 'Ver detalhes da extração'}
                </button>
              )}

              {/* Detalhes expandidos */}
              {mostrarDetalhesRelatorio && (
                <div className="space-y-3 border rounded-md p-3 bg-muted/30">
                  {/* Exames encontrados e cadastrados */}
                  {relatorioExtracao.examesEncontrados.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-green-700 mb-2 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Exames encontrados no PDF e cadastrados ({relatorioExtracao.examesEncontrados.length})
                      </h4>
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {relatorioExtracao.examesEncontrados.map((exame, index) => (
                          <div key={index} className="text-xs flex justify-between items-center py-1 border-b border-muted last:border-0">
                            <span className="text-muted-foreground">{exame.nome}</span>
                            <span className="font-medium text-foreground truncate max-w-[150px]" title={exame.valor}>
                              {exame.valor}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Exames não presentes no PDF (informativo) */}
                  {examesNaoPresentes.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1">
                        <Info className="h-3 w-3" />
                        Exames não presentes no PDF ({examesNaoPresentes.length})
                      </h4>
                      <div className="max-h-32 overflow-y-auto">
                        <div className="flex flex-wrap gap-1">
                          {examesNaoPresentes.map((exame, index) => (
                            <span key={index} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                              {exame}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
          })()}
        </div>

        <DialogFooter className="flex-shrink-0 pt-2 border-t">
          {relatorioExtracao ? (
            // Após processamento, mostrar apenas botão de fechar
            <Button onClick={handleClose}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Fechar
            </Button>
          ) : (
            // Durante seleção de arquivos
            <>
              <Button variant="outline" onClick={handleClose} disabled={isProcessing}>
                Cancelar
              </Button>
              <Button 
                type="button" 
                onClick={handleInterpretarTodos}
                disabled={files.length === 0 || isProcessing || pdfProtegido || verificandoPdf}
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
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
