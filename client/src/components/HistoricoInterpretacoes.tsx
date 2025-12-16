import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { History, Eye, Trash2, FileText, Stethoscope, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';

interface HistoricoInterpretacoesProps {
  gestanteId: number;
  tipo: 'exames_laboratoriais' | 'ultrassom';
}

export function HistoricoInterpretacoes({ gestanteId, tipo }: HistoricoInterpretacoesProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);

  const { data: historico, isLoading, refetch } = trpc.historicoInterpretacoes.listar.useQuery(
    { gestanteId, tipoInterpretacao: tipo },
    { enabled: gestanteId > 0 }
  );

  const deletarMutation = trpc.historicoInterpretacoes.deletar.useMutation({
    onSuccess: () => {
      toast.success('Registro excluído com sucesso');
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao excluir: ${error.message}`);
    },
  });

  const formatarData = (data: Date | string) => {
    const d = new Date(data);
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTipoExameLabel = (tipoExame: string | null) => {
    if (!tipoExame) return '-';
    
    const labels: Record<string, string> = {
      primeiro: '1º Trimestre',
      segundo: '2º Trimestre',
      terceiro: '3º Trimestre',
      primeiro_ultrassom: '1º Ultrassom',
      morfologico_1tri: 'Morfológico 1º Tri',
      ultrassom_obstetrico: 'US Obstétrico',
      morfologico_2tri: 'Morfológico 2º Tri',
      ecocardiograma: 'Ecocardiograma',
      ultrassom_seguimento: 'US Seguimento',
    };
    
    return labels[tipoExame] || tipoExame;
  };

  const handleDelete = (id: number) => {
    if (confirm('Tem certeza que deseja excluir este registro?')) {
      deletarMutation.mutate({ id });
    }
  };

  const handleViewDetails = (item: any) => {
    setSelectedItem(item);
    setShowDetails(true);
  };

  if (!gestanteId || gestanteId <= 0) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm py-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        Carregando histórico...
      </div>
    );
  }

  if (!historico || historico.length === 0) {
    return null;
  }

  return (
    <>
      <Card className="mt-4">
        <CardHeader className="py-3 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">
                Histórico de Interpretações ({historico.length})
              </CardTitle>
            </div>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
          <CardDescription className="text-xs">
            Registros das interpretações feitas pela IA
          </CardDescription>
        </CardHeader>
        
        {isExpanded && (
          <CardContent className="pt-0">
            <div className="space-y-2">
              {historico.map((item: any) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-md"
                >
                  <div className="flex items-center gap-3">
                    {tipo === 'exames_laboratoriais' ? (
                      <FileText className="h-5 w-5 text-blue-500" />
                    ) : (
                      <Stethoscope className="h-5 w-5 text-purple-500" />
                    )}
                    <div>
                      <p className="text-sm font-medium">
                        {getTipoExameLabel(item.tipoExame)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatarData(item.dataInterpretacao)} • {item.arquivosProcessados} arquivo(s)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewDetails(item)}
                      className="h-8 w-8 p-0"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(item.id)}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                      disabled={deletarMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Modal de detalhes */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Interpretação</DialogTitle>
            <DialogDescription>
              {selectedItem && formatarData(selectedItem.dataInterpretacao)}
            </DialogDescription>
          </DialogHeader>
          
          {selectedItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Tipo</p>
                  <p className="font-medium">{getTipoExameLabel(selectedItem.tipoExame)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Arquivos Processados</p>
                  <p className="font-medium">{selectedItem.arquivosProcessados}</p>
                </div>
              </div>
              
              <div>
                <p className="text-muted-foreground text-sm mb-2">Dados Extraídos</p>
                <div className="bg-muted rounded-md p-3 max-h-[400px] overflow-y-auto">
                  <pre className="text-xs whitespace-pre-wrap">
                    {JSON.stringify(selectedItem.resultadoJson, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
