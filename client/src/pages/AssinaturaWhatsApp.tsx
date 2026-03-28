import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import GestantesLayout from "@/components/GestantesLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  MessageCircle,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Loader2,
  CreditCard,
  Users,
  RefreshCw,
} from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pendente_instalacao: {
    label: "Aguardando Instalação",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: <Clock className="w-4 h-4" />,
  },
  aguardando_pagamento: {
    label: "Aguardando Pagamento",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: <CreditCard className="w-4 h-4" />,
  },
  ativa: {
    label: "Ativa",
    color: "bg-green-100 text-green-800 border-green-200",
    icon: <CheckCircle2 className="w-4 h-4" />,
  },
  suspensa: {
    label: "Suspensa",
    color: "bg-red-100 text-red-800 border-red-200",
    icon: <AlertCircle className="w-4 h-4" />,
  },
  cancelada: {
    label: "Cancelada",
    color: "bg-gray-100 text-gray-800 border-gray-200",
    icon: <XCircle className="w-4 h-4" />,
  },
};

export default function AssinaturaWhatsApp() {
  const { user } = useAuth();
  const [obstetrasSelected, setObstetrasSelected] = useState<number[]>([]);

  // Buscar status da assinatura
  const { data: assinatura, isLoading: loadingAssinatura, refetch } =
    trpc.whatsappAssinatura.getStatus.useQuery();

  // Sincronizar obstetras selecionados quando assinatura carrega
  const prevAssinaturaRef = useState<string | null>(null);
  if (assinatura?.obstetras && JSON.stringify(assinatura.obstetras) !== prevAssinaturaRef[0]) {
    prevAssinaturaRef[1](JSON.stringify(assinatura.obstetras));
    setObstetrasSelected(assinatura.obstetras.filter((o: any) => o.ativo).map((o: any) => o.id));
  }

  // Buscar obstetras da clínica
  const { data: medicos, isLoading: loadingMedicos } = trpc.medicos.listar.useQuery();
  const obstetras = (medicos || []).filter((m: any) => m.ativo !== 0);

  // Mutations
  const utils = trpc.useUtils();

  const solicitarMutation = trpc.whatsappAssinatura.solicitarInstalacao.useMutation({
    onSuccess: () => {
      toast.success("Solicitação enviada! Aguarde a confirmação do suporte.");
      utils.whatsappAssinatura.getStatus.invalidate();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const checkoutMutation = trpc.whatsappAssinatura.criarCheckout.useMutation({
    onSuccess: (data) => {
      toast.info("Redirecionando para o pagamento...");
      window.open(data.checkoutUrl || "", "_blank");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const selecionarObstetras = trpc.whatsappAssinatura.selecionarObstetras.useMutation({
    onSuccess: () => {
      toast.success("Obstetras atualizados com sucesso!");
      utils.whatsappAssinatura.getStatus.invalidate();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const cancelarMutation = trpc.whatsappAssinatura.cancelar.useMutation({
    onSuccess: () => {
      toast.success("Assinatura cancelada.");
      utils.whatsappAssinatura.getStatus.invalidate();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleObstetra = (id: number) => {
    setObstetrasSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const valorTotal = obstetrasSelected.length * 49.9;
  const statusInfo = assinatura ? STATUS_CONFIG[assinatura.status] : null;

  if (loadingAssinatura) {
    return (
      <GestantesLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </GestantesLayout>
    );
  }

  return (
    <GestantesLayout>
      <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
        {/* Cabeçalho */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-green-100">
            <MessageCircle className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">WhatsApp Programado</h1>
            <p className="text-muted-foreground text-sm">Assinatura do serviço de mensagens automáticas</p>
          </div>
        </div>

        {/* Status atual */}
        {assinatura && statusInfo && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Status da assinatura:</span>
                  <Badge className={`flex items-center gap-1 border ${statusInfo.color}`} variant="outline">
                    {statusInfo.icon}
                    {statusInfo.label}
                  </Badge>
                </div>
                <Button variant="ghost" size="sm" onClick={() => refetch()}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>

              {assinatura.status === "ativa" && (
                <p className="text-sm text-green-700 mt-2 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  Serviço ativo — {assinatura.quantidadeObstetras} obstetra(s) com acesso
                </p>
              )}

              {assinatura.status === "pendente_instalacao" && (
                <p className="text-sm text-yellow-700 mt-2">
                  Sua solicitação foi recebida. O suporte irá entrar em contato para realizar a instalação.
                </p>
              )}

              {assinatura.status === "aguardando_pagamento" && (
                <p className="text-sm text-blue-700 mt-2">
                  A instalação foi confirmada! Clique abaixo para selecionar os obstetras e realizar o pagamento.
                </p>
              )}

              {assinatura.status === "suspensa" && (
                <p className="text-sm text-red-700 mt-2">
                  O acesso está suspenso por falha no pagamento. Regularize para reativar o serviço.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Sem assinatura — solicitar instalação */}
        {!assinatura && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contratar Serviço de WhatsApp</CardTitle>
              <CardDescription>
                Envie mensagens automáticas para suas pacientes diretamente pelo WhatsApp.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-muted p-4 space-y-2 text-sm">
                <p className="font-medium">Como funciona:</p>
                <ul className="space-y-1 text-muted-foreground list-disc list-inside">
                  <li>Você solicita a instalação do serviço</li>
                  <li>Nossa equipe realiza a configuração técnica</li>
                  <li>Após a instalação, você seleciona os obstetras e realiza o pagamento</li>
                  <li>Acesso imediato após confirmação do pagamento</li>
                </ul>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <span className="text-sm font-medium">Valor por obstetra</span>
                <span className="font-bold text-lg">R$ 49,90/mês</span>
              </div>
              <Button
                className="w-full"
                onClick={() => solicitarMutation.mutate()}
                disabled={solicitarMutation.isPending}
              >
                {solicitarMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <MessageCircle className="w-4 h-4 mr-2" />
                )}
                Solicitar Instalação
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Seleção de obstetras (aguardando pagamento ou ativa) */}
        {assinatura && (assinatura.status === "aguardando_pagamento" || assinatura.status === "ativa") && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5" />
                Obstetras com Acesso
              </CardTitle>
              <CardDescription>
                Selecione quais obstetras terão acesso ao módulo de WhatsApp.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingMedicos ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
              ) : obstetras.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum obstetra cadastrado nesta clínica.
                </p>
              ) : (
                <div className="space-y-3">
                  {obstetras.map((medico: any) => (
                    <div
                      key={medico.id}
                      className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                      onClick={() => toggleObstetra(medico.userId || medico.id)}
                    >
                      <Checkbox
                        checked={obstetrasSelected.includes(medico.userId || medico.id)}
                        onCheckedChange={() => toggleObstetra(medico.userId || medico.id)}
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{medico.nome}</p>
                        {medico.crm && (
                          <p className="text-xs text-muted-foreground">CRM: {medico.crm}</p>
                        )}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        R$ 49,90/mês
                      </Badge>
                    </div>
                  ))}
                </div>
              )}

              <Separator />

              <div className="flex items-center justify-between font-medium">
                <span>Total mensal:</span>
                <span className="text-lg">
                  {obstetrasSelected.length} × R$ 49,90 ={" "}
                  <span className="text-green-700">
                    R$ {valorTotal.toFixed(2).replace(".", ",")}
                  </span>
                </span>
              </div>

              {assinatura.status === "aguardando_pagamento" && (
                <Button
                  className="w-full"
                  onClick={() => checkoutMutation.mutate({ obstetrasIds: obstetrasSelected })}
                  disabled={checkoutMutation.isPending || obstetrasSelected.length === 0}
                >
                  {checkoutMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CreditCard className="w-4 h-4 mr-2" />
                  )}
                  Realizar Pagamento
                </Button>
              )}

              {assinatura.status === "ativa" && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() =>
                    selecionarObstetras.mutate({ obstetrasIds: obstetrasSelected })
                  }
                  disabled={selecionarObstetras.isPending}
                >
                  {selecionarObstetras.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Users className="w-4 h-4 mr-2" />
                  )}
                  Salvar Alterações
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Cancelar assinatura */}
        {assinatura && assinatura.status === "ativa" && (
          <Card className="border-red-200">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-3">
                Para cancelar a assinatura, clique abaixo. O acesso será mantido até o fim do período pago.
              </p>
              <Button
                variant="outline"
                className="text-red-600 border-red-200 hover:bg-red-50 w-full"
                onClick={() => {
                  if (confirm("Tem certeza que deseja cancelar a assinatura?")) {
                    cancelarMutation.mutate();
                  }
                }}
                disabled={cancelarMutation.isPending}
              >
                {cancelarMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4 mr-2" />
                )}
                Cancelar Assinatura
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </GestantesLayout>
  );
}
