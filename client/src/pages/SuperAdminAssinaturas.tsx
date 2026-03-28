import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import GestantesLayout from "@/components/GestantesLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Loader2,
  CreditCard,
  Building2,
  RefreshCw,
  ArrowLeft,
} from "lucide-react";
import { useLocation } from "wouter";

const STATUS_BADGE: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pendente_instalacao: {
    label: "Aguardando Instalação",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: <Clock className="w-3 h-3" />,
  },
  aguardando_pagamento: {
    label: "Aguardando Pagamento",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: <CreditCard className="w-3 h-3" />,
  },
  ativa: {
    label: "Ativa",
    color: "bg-green-100 text-green-800 border-green-200",
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
  suspensa: {
    label: "Suspensa",
    color: "bg-red-100 text-red-800 border-red-200",
    icon: <AlertCircle className="w-3 h-3" />,
  },
  cancelada: {
    label: "Cancelada",
    color: "bg-gray-100 text-gray-800 border-gray-200",
    icon: <XCircle className="w-3 h-3" />,
  },
};

export default function SuperAdminAssinaturas() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  // Verificar se é superadmin
  if (user && user.role !== "superadmin") {
    return (
      <GestantesLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Acesso restrito ao suporte.</p>
        </div>
      </GestantesLayout>
    );
  }

  const { data: pendentes, isLoading: loadingPendentes } =
    trpc.whatsappAssinatura.listarSolicitacoesPendentes.useQuery();

  const { data: todas, isLoading: loadingTodas } =
    trpc.whatsappAssinatura.listarTodasAssinaturas.useQuery();

  const confirmarMutation = trpc.whatsappAssinatura.confirmarInstalacao.useMutation({
    onSuccess: (_, vars) => {
      toast.success(`Instalação confirmada para assinatura #${vars.assinaturaId}!`);
      utils.whatsappAssinatura.listarSolicitacoesPendentes.invalidate();
      utils.whatsappAssinatura.listarTodasAssinaturas.invalidate();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const formatDate = (d: Date | string | null) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("pt-BR");
  };

  return (
    <GestantesLayout>
      <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
        {/* Cabeçalho */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin-clinicas")}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Assinaturas WhatsApp</h1>
            <p className="text-muted-foreground text-sm">Painel de gerenciamento de assinaturas — Suporte</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto"
            onClick={() => {
              utils.whatsappAssinatura.listarSolicitacoesPendentes.invalidate();
              utils.whatsappAssinatura.listarTodasAssinaturas.invalidate();
            }}
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

        {/* Solicitações pendentes de instalação */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
              Aguardando Instalação
              {pendentes && pendentes.length > 0 && (
                <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 border ml-2">
                  {pendentes.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingPendentes ? (
              <div className="flex justify-center py-6">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : !pendentes || pendentes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma solicitação pendente de instalação.
              </p>
            ) : (
              <div className="space-y-3">
                {pendentes.map((assinatura: any) => (
                  <div
                    key={assinatura.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-yellow-50/50"
                  >
                    <div className="flex items-center gap-3">
                      <Building2 className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">
                          {assinatura.clinicaNome || `Clínica ${assinatura.clinicaId}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Solicitado em {formatDate(assinatura.createdAt)}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() =>
                        confirmarMutation.mutate({ assinaturaId: assinatura.id })
                      }
                      disabled={confirmarMutation.isPending}
                    >
                      {confirmarMutation.isPending ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                      )}
                      Confirmar Instalação
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Todas as assinaturas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CreditCard className="w-5 h-5 text-muted-foreground" />
              Todas as Assinaturas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingTodas ? (
              <div className="flex justify-center py-6">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : !todas || todas.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma assinatura cadastrada.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Clínica</th>
                      <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Status</th>
                      <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Obstetras</th>
                      <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Valor/mês</th>
                      <th className="text-left py-2 font-medium text-muted-foreground">Desde</th>
                    </tr>
                  </thead>
                  <tbody>
                    {todas.map((assinatura: any) => {
                      const statusInfo = STATUS_BADGE[assinatura.status];
                      const valorMensal = (assinatura.quantidadeObstetras || 0) * 49.9;
                      return (
                        <tr key={assinatura.id} className="border-b last:border-0 hover:bg-muted/30">
                          <td className="py-3 pr-4">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-muted-foreground" />
                              <span className="font-medium">
                                {assinatura.clinicaNome || `Clínica ${assinatura.clinicaId}`}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 pr-4">
                            {statusInfo && (
                              <Badge
                                className={`flex items-center gap-1 w-fit border ${statusInfo.color}`}
                                variant="outline"
                              >
                                {statusInfo.icon}
                                {statusInfo.label}
                              </Badge>
                            )}
                          </td>
                          <td className="py-3 pr-4 text-center">
                            {assinatura.quantidadeObstetras || 0}
                          </td>
                          <td className="py-3 pr-4">
                            {assinatura.quantidadeObstetras
                              ? `R$ ${valorMensal.toFixed(2).replace(".", ",")}`
                              : "—"}
                          </td>
                          <td className="py-3 text-muted-foreground">
                            {formatDate(assinatura.createdAt)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </GestantesLayout>
  );
}
