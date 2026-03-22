import { useState } from 'react';
import { ArrowLeft, FileText, Image, Clock, CheckCircle, XCircle, ExternalLink, Brain, AlertTriangle, Loader2 } from 'lucide-react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/lib/trpc';
import GestantesLayout from '@/components/GestantesLayout';
import { toast } from 'sonner';

export default function ExamesPendentes() {
  const [, setLocation] = useLocation();

  const { data: pendentes, isLoading, refetch } = trpc.examesLab.listarPendentes.useQuery(undefined, {
    refetchInterval: 30_000,
  });

  const confirmarMutation = trpc.examesLab.confirmarExame.useMutation({
    onSuccess: () => {
      toast.success('Exame confirmado — aprovado com sucesso.');
      refetch();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const rejeitarMutation = trpc.examesLab.rejeitarExame.useMutation({
    onSuccess: () => {
      toast.success('Exame rejeitado.');
      refetch();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const formatDate = (date: string | Date | null) => {
    if (!date) return '—';
    const d = new Date(date);
    return d.toLocaleDateString('pt-BR');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (tipoArquivo: string) => {
    if (tipoArquivo?.startsWith('image/')) return <Image className="h-5 w-5 text-blue-500" />;
    return <FileText className="h-5 w-5 text-red-500" />;
  };

  return (
    <GestantesLayout>
      <div className="space-y-6">
        {/* Header com botão de voltar */}
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation('/dashboard')}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Exames Pendentes de Revisão</h1>
            <p className="text-muted-foreground">
              Exames enviados pelas gestantes pelo app mobile aguardando sua aprovação
            </p>
          </div>
          {pendentes && pendentes.length > 0 && (
            <Badge variant="destructive" className="text-sm px-3 py-1">
              {pendentes.length} pendente{pendentes.length > 1 ? 's' : ''}
            </Badge>
          )}
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-3 text-muted-foreground">Carregando exames pendentes...</span>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && (!pendentes || pendentes.length === 0) && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum exame pendente</h3>
              <p className="text-muted-foreground text-center max-w-md">
                Todos os exames enviados pelo app mobile já foram revisados. Novos envios aparecerão aqui automaticamente.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Lista de exames pendentes */}
        {pendentes && pendentes.length > 0 && (
          <div className="grid gap-4">
            {pendentes.map((exame) => (
              <Card key={exame.id} className="border-l-4 border-l-orange-400">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {getFileIcon(exame.tipoArquivo)}
                      <div>
                        <CardTitle className="text-base">{exame.gestanteNome}</CardTitle>
                        <p className="text-sm text-muted-foreground">{exame.nomeArquivo}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {exame.tipoExame === 'laboratorial' ? 'Laboratorial' : 'Ultrassom'}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatDate(exame.createdAt)}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Detalhes do arquivo */}
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span>Tamanho: {formatFileSize(exame.tamanhoBytes)}</span>
                    {exame.trimestre && <span>Trimestre: {exame.trimestre}º</span>}
                    {exame.dataColeta && <span>Data coleta: {formatDate(exame.dataColeta)}</span>}
                  </div>

                  {/* Observações da gestante */}
                  {exame.observacoes && (
                    <div className="bg-muted/50 rounded-md p-3">
                      <p className="text-sm font-medium mb-1">Observações da gestante:</p>
                      <p className="text-sm text-muted-foreground">{exame.observacoes}</p>
                    </div>
                  )}

                  {/* Status da IA */}
                  {exame.iaProcessado ? (
                    exame.iaErro ? (
                      <div className="flex items-center gap-2 text-sm text-orange-600 bg-orange-50 rounded-md p-2">
                        <AlertTriangle className="h-4 w-4" />
                        <span>IA não conseguiu interpretar: {exame.iaErro}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 rounded-md p-2">
                        <Brain className="h-4 w-4" />
                        <span>IA processou o exame com sucesso — resultados disponíveis ao confirmar</span>
                      </div>
                    )
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 rounded-md p-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>IA processando o exame em background...</span>
                    </div>
                  )}

                  {/* Ações */}
                  <div className="flex items-center gap-3 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(exame.s3Url, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Visualizar arquivo
                    </Button>
                    <div className="flex-1" />
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => rejeitarMutation.mutate({ id: exame.id })}
                      disabled={rejeitarMutation.isPending || confirmarMutation.isPending}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Rejeitar
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => confirmarMutation.mutate({ id: exame.id })}
                      disabled={confirmarMutation.isPending || rejeitarMutation.isPending}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Confirmar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </GestantesLayout>
  );
}
