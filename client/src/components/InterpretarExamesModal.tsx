import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Upload, FileText, Image, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface InterpretarExamesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResultados: (resultados: Record<string, string>, trimestre: string) => void;
}

export function InterpretarExamesModal({ open, onOpenChange, onResultados }: InterpretarExamesModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [trimestre, setTrimestre] = useState<"primeiro" | "segundo" | "terceiro">("primeiro");
  const [isProcessing, setIsProcessing] = useState(false);

  const interpretarMutation = trpc.examesLab.interpretarComIA.useMutation({
    onSuccess: (data) => {
      toast.success(`${Object.keys(data.resultados).length} exames interpretados com sucesso!`);
      onResultados(data.resultados, trimestre);
      handleClose();
    },
    onError: (error) => {
      toast.error(`Erro ao interpretar exames: ${error.message}`);
      setIsProcessing(false);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validar tipo de arquivo
      const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!validTypes.includes(selectedFile.type)) {
        toast.error('Tipo de arquivo inválido. Aceito: PDF, JPEG, PNG, WEBP');
        return;
      }
      
      // Validar tamanho (máximo 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error('Arquivo muito grande. Tamanho máximo: 10MB');
        return;
      }
      
      setFile(selectedFile);
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      toast.error('Selecione um arquivo');
      return;
    }

    setIsProcessing(true);

    try {
      // Converter arquivo para base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        const base64Data = base64.split(',')[1]; // Remover prefixo "data:..."

        // Chamar mutation
        await interpretarMutation.mutateAsync({
          fileBase64: base64Data,
          mimeType: file.type,
          trimestre,
        });
      };
      reader.onerror = () => {
        toast.error('Erro ao ler arquivo');
        setIsProcessing(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Erro ao processar arquivo:', error);
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setTrimestre("primeiro");
    setIsProcessing(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Interpretar Exames com IA</DialogTitle>
          <DialogDescription>
            Faça upload de um PDF ou foto dos exames laboratoriais. A IA irá extrair automaticamente os valores e preencher os campos.
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

          {/* Upload de Arquivo */}
          <div className="space-y-3">
            <Label htmlFor="file-upload" className="text-base font-semibold">
              Arquivo do Exame
            </Label>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('file-upload')?.click()}
                className="w-full"
              >
                <Upload className="mr-2 h-4 w-4" />
                {file ? 'Trocar Arquivo' : 'Selecionar Arquivo'}
              </Button>
              <input
                id="file-upload"
                type="file"
                accept=".pdf,image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
            
            {file && (
              <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                {file.type === 'application/pdf' ? (
                  <FileText className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <Image className="h-5 w-5 text-muted-foreground" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
            )}
            
            <p className="text-xs text-muted-foreground">
              Formatos aceitos: PDF, JPEG, PNG, WEBP (máx. 10MB)
            </p>
          </div>

          {/* Aviso */}
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md p-3">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <strong>Nota:</strong> A IA irá preencher automaticamente todos os campos de exames, 
              <strong> exceto o campo "Observações / Outros Exames"</strong>, que permanece exclusivo para digitação manual.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isProcessing}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!file || isProcessing}>
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Interpretar Exames
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
