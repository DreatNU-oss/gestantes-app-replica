import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, CheckCircle2, XCircle, AlertTriangle, Link2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Integracoes() {
  const [syncResult, setSyncResult] = useState<{
    sucesso: number;
    falhas: number;
    total: number;
    detalhes: Array<{ nome: string; status: "sucesso" | "falha"; mensagem: string }>;
  } | null>(null);

  // Verificar status da integração
  const { data: statusIntegracao, isLoading: loadingStatus } = trpc.integracao.status.useQuery();

  // Mutation de sincronização em lote
  const syncMutation = trpc.integracao.syncCesareas.useMutation({
    onSuccess: (data) => {
      setSyncResult(data);
      if (data.total === 0) {
        toast.info("Nenhuma cesárea para sincronizar", {
          description: "Não há gestantes com data de cesárea programada no banco de dados.",
        });
      } else if (data.falhas === 0) {
        toast.success("Sincronização concluída", {
          description: `${data.sucesso} agendamento(s) sincronizado(s) com sucesso.`,
        });
      } else {
        toast.warning("Sincronização parcial", {
          description: `${data.sucesso} sucesso, ${data.falhas} falha(s) de ${data.total} total.`,
        });
      }
    },
    onError: (error) => {
      toast.error("Erro na sincronização", {
        description: error.message,
      });
    },
  });

  return (
    <div className="container max-w-4xl py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Integrações</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie as integrações com sistemas externos.
        </p>
      </div>

      {/* Card: Mapa Cirúrgico */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Link2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Mapa Cirúrgico</CardTitle>
                <CardDescription>
                  Sincronização de cesáreas com o sistema administrativo
                </CardDescription>
              </div>
            </div>
            {loadingStatus ? (
              <Badge variant="outline">Verificando...</Badge>
            ) : statusIntegracao?.configurado ? (
              <Badge variant="default" className="bg-green-600">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Configurado
              </Badge>
            ) : (
              <Badge variant="destructive">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Não configurado
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground space-y-2">
            <p>
              Esta integração envia automaticamente os agendamentos de cesáreas para o Mapa Cirúrgico
              do sistema administrativo da Clínica Mais Mulher.
            </p>
            <p>
              <strong>Sincronização automática:</strong> Sempre que uma data de cesárea for registrada,
              alterada ou removida, o sistema sincroniza automaticamente com o Mapa Cirúrgico.
            </p>
            <p>
              <strong>Sincronização em lote:</strong> Use o botão abaixo para enviar todas as cesáreas
              já cadastradas de uma vez. Pode ser executado múltiplas vezes sem duplicar (upsert automático).
            </p>
          </div>

          {!statusIntegracao?.configurado && !loadingStatus && (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                <div>
                  <strong>Configuração necessária:</strong> As variáveis de ambiente{" "}
                  <code className="bg-yellow-100 px-1 rounded">ADMIN_SYSTEM_URL</code> e{" "}
                  <code className="bg-yellow-100 px-1 rounded">ADMIN_INTEGRATION_API_KEY</code>{" "}
                  precisam ser configuradas para ativar a integração.
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <Button
              onClick={() => {
                setSyncResult(null);
                syncMutation.mutate();
              }}
              disabled={syncMutation.isPending || !statusIntegracao?.configurado}
            >
              {syncMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sincronizando...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sincronizar Cesáreas com Mapa Cirúrgico
                </>
              )}
            </Button>
          </div>

          {/* Resultado da sincronização */}
          {syncResult && (
            <div className="space-y-3 mt-4">
              <div className="rounded-lg border p-4">
                <h4 className="font-medium mb-2">Resultado da Sincronização</h4>
                <div className="grid grid-cols-3 gap-4 mb-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{syncResult.sucesso}</div>
                    <div className="text-xs text-muted-foreground">Sucesso</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{syncResult.falhas}</div>
                    <div className="text-xs text-muted-foreground">Falhas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{syncResult.total}</div>
                    <div className="text-xs text-muted-foreground">Total</div>
                  </div>
                </div>
                {syncResult.total > 0 && (
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-green-600 h-full rounded-full transition-all"
                      style={{ width: `${(syncResult.sucesso / syncResult.total) * 100}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Detalhes por gestante */}
              {syncResult.detalhes.length > 0 && (
                <div className="rounded-lg border">
                  <div className="p-3 border-b bg-muted/50">
                    <h4 className="font-medium text-sm">Detalhes</h4>
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {syncResult.detalhes.map((detalhe, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between px-3 py-2 border-b last:border-b-0 text-sm"
                      >
                        <div className="flex items-center gap-2">
                          {detalhe.status === "sucesso" ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                          )}
                          <span>{detalhe.nome}</span>
                        </div>
                        <Badge
                          variant={detalhe.status === "sucesso" ? "outline" : "destructive"}
                          className="text-xs"
                        >
                          {detalhe.mensagem}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
