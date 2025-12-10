import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Upload, AlertCircle } from 'lucide-react';
import { storagePut } from '../../../server/storage';

interface InterpretarUltrassomModalProps {
  open: boolean;
  onClose: () => void;
  onDadosExtraidos: (tipo: string, dados: Record<string, string>) => void;
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
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string>('');

  const interpretarMutation = trpc.ultrassons.interpretar.useMutation({
    onSuccess: (data) => {
      onDadosExtraidos(tipoSelecionado, data.dados);
      handleClose();
    },
    onError: (error) => {
      setError(`Erro ao interpretar laudo: ${error.message}`);
      setUploading(false);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Tipo de arquivo não suportado. Use PDF, JPEG, PNG ou WEBP.');
      return;
    }

    // Validar tamanho (máx 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Arquivo muito grande. Tamanho máximo: 10MB');
      return;
    }

    setArquivo(file);
    setError('');
  };

  const handleInterpretar = async () => {
    if (!arquivo || !tipoSelecionado) return;

    setUploading(true);
    setError('');

    try {
      // 1. Fazer upload do arquivo para S3
      const arrayBuffer = await arquivo.arrayBuffer();
      const buffer = new Uint8Array(arrayBuffer);
      
      // Converter para base64 para enviar ao backend
      const base64 = btoa(String.fromCharCode(...buffer));
      
      // Chamar backend para fazer upload
      const uploadResponse = await fetch('/api/upload-laudo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: arquivo.name,
          fileData: base64,
          mimeType: arquivo.type,
        }),
      });

      if (!uploadResponse.ok) {
        throw new Error('Erro ao fazer upload do arquivo');
      }

      const { url: fileUrl } = await uploadResponse.json();

      // 2. Chamar IA para interpretar
      interpretarMutation.mutate({
        fileUrl,
        tipoUltrassom: tipoSelecionado as any,
        mimeType: arquivo.type,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setUploading(false);
    }
  };

  const handleClose = () => {
    setTipoSelecionado('');
    setArquivo(null);
    setError('');
    setUploading(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Interpretar Laudo de Ultrassom com IA</DialogTitle>
          <DialogDescription>
            Faça upload de um PDF ou foto do laudo de ultrassom para preencher automaticamente os campos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Seleção de Tipo de Ultrassom */}
          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo de Ultrassom *</Label>
            <Select value={tipoSelecionado} onValueChange={setTipoSelecionado}>
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

          {/* Upload de Arquivo */}
          <div className="space-y-2">
            <Label htmlFor="arquivo">Arquivo do Laudo *</Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('arquivo')?.click()}
                className="w-full"
              >
                <Upload className="mr-2 h-4 w-4" />
                {arquivo ? arquivo.name : 'Selecionar Arquivo'}
              </Button>
              <input
                id="arquivo"
                type="file"
                accept=".pdf,image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Formatos aceitos: PDF, JPEG, PNG, WEBP (máx. 10MB)
            </p>
          </div>

          {/* Aviso */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-blue-800">
                A IA preencherá automaticamente os campos do ultrassom selecionado com base no laudo fornecido.
              </p>
            </div>
          </div>

          {/* Erro */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
        </div>

        {/* Botões */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleClose} disabled={uploading}>
            Cancelar
          </Button>
          <Button
            onClick={handleInterpretar}
            disabled={!arquivo || !tipoSelecionado || uploading}
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Interpretando...
              </>
            ) : (
              'Interpretar Laudo'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
