import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { FileText, Image, Download, Eye, Trash2, Lock, Calendar, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ArquivosExamesSectionProps {
  gestanteId: number;
}

export function ArquivosExamesSection({ gestanteId }: ArquivosExamesSectionProps) {
  const [arquivoParaExcluir, setArquivoParaExcluir] = useState<number | null>(null);
  const [carregandoVisualizacao, setCarregandoVisualizacao] = useState<number | null>(null);
  
  const utils = trpc.useUtils();
  
  const { data: arquivos, isLoading } = trpc.examesLab.listarArquivos.useQuery(
    { gestanteId },
    { enabled: !!gestanteId }
  );
  
  const obterArquivoComSenha = trpc.examesLab.obterArquivoComSenha.useQuery;
  
  const excluirMutation = trpc.examesLab.excluirArquivo.useMutation({
    onSuccess: () => {
      toast.success("Arquivo excluído com sucesso");
      utils.examesLab.listarArquivos.invalidate({ gestanteId });
    },
    onError: (error) => {
      toast.error("Erro ao excluir arquivo: " + error.message);
    },
  });
  
  const formatarTamanho = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };
  
  const formatarData = (data: Date | string | null) => {
    if (!data) return "-";
    const d = new Date(data);
    return d.toLocaleDateString("pt-BR");
  };
  
  const obterIconeArquivo = (tipoArquivo: string) => {
    if (tipoArquivo.startsWith("image/")) {
      return <Image className="h-5 w-5 text-blue-500" />;
    }
    return <FileText className="h-5 w-5 text-rose-500" />;
  };
  
  const handleVisualizar = async (arquivo: { id: number; s3Url: string; protegidoPorSenha: number; tipoArquivo: string }) => {
    setCarregandoVisualizacao(arquivo.id);
    
    try {
      if (arquivo.protegidoPorSenha === 1 && arquivo.tipoArquivo === "application/pdf") {
        // Para PDFs protegidos, precisamos desbloquear antes de abrir
        // Por enquanto, apenas abrimos a URL direta (o usuário terá que digitar a senha no visualizador)
        // TODO: Implementar desbloqueio automático usando a senha salva
        window.open(arquivo.s3Url, "_blank");
        toast.info("Este PDF é protegido por senha. Use a senha salva para abrir.");
      } else {
        // Arquivo não protegido - abrir diretamente
        window.open(arquivo.s3Url, "_blank");
      }
    } catch (error) {
      toast.error("Erro ao visualizar arquivo");
    } finally {
      setCarregandoVisualizacao(null);
    }
  };
  
  const handleDownload = (arquivo: { s3Url: string; nomeArquivo: string }) => {
    // Criar link de download
    const link = document.createElement("a");
    link.href = arquivo.s3Url;
    link.download = arquivo.nomeArquivo;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  if (isLoading) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Arquivos de Exames
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-rose-500" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!arquivos || arquivos.length === 0) {
    return null; // Não mostrar seção se não houver arquivos
  }
  
  return (
    <>
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Arquivos de Exames ({arquivos.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {arquivos.map((arquivo) => (
              <div
                key={arquivo.id}
                className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors"
              >
                {/* Ícone do arquivo */}
                <div className="flex-shrink-0">
                  {obterIconeArquivo(arquivo.tipoArquivo)}
                </div>
                
                {/* Informações do arquivo */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-800 truncate">
                      {arquivo.nomeArquivo}
                    </span>
                    {arquivo.protegidoPorSenha === 1 && (
                      <span title="PDF protegido por senha">
                        <Lock className="h-4 w-4 text-amber-500" />
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                    <span>{formatarTamanho(arquivo.tamanhoBytes)}</span>
                    {arquivo.trimestre && (
                      <span className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded">
                        {arquivo.trimestre}º Tri
                      </span>
                    )}
                    {arquivo.dataColeta && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatarData(arquivo.dataColeta)}
                      </span>
                    )}
                    <span>Enviado em {formatarData(arquivo.createdAt)}</span>
                  </div>
                </div>
                
                {/* Ações */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleVisualizar(arquivo)}
                    disabled={carregandoVisualizacao === arquivo.id}
                    title="Visualizar"
                  >
                    {carregandoVisualizacao === arquivo.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(arquivo)}
                    title="Baixar"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setArquivoParaExcluir(arquivo.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    title="Excluir"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={arquivoParaExcluir !== null} onOpenChange={(open: boolean) => !open && setArquivoParaExcluir(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este arquivo? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (arquivoParaExcluir) {
                  excluirMutation.mutate({ id: arquivoParaExcluir });
                  setArquivoParaExcluir(null);
                }
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
