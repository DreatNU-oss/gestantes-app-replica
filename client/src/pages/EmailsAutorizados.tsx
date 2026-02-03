import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Loader2, 
  Mail, 
  Plus, 
  Trash2, 
  ArrowLeft, 
  CheckCircle,
  ShieldCheck,
  Users,
  Lock,
  Unlock,
  AlertTriangle,
  User
} from "lucide-react";
import { toast } from "sonner";

export default function EmailsAutorizados() {
  const [, setLocation] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [novoEmail, setNovoEmail] = useState("");
  const [emailParaRemover, setEmailParaRemover] = useState<string | null>(null);
  const [emailParaDesbloquear, setEmailParaDesbloquear] = useState<string | null>(null);
  const [erro, setErro] = useState("");

  const { data: emails, isLoading, refetch } = trpc.auth.listarEmailsAutorizados.useQuery();

  const adicionarMutation = trpc.auth.adicionarEmailAutorizado.useMutation({
    onSuccess: () => {
      toast.success("Email autorizado com sucesso!");
      setNovoEmail("");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao adicionar email");
    },
  });

  const removerMutation = trpc.auth.removerEmailAutorizado.useMutation({
    onSuccess: () => {
      toast.success("Email removido com sucesso!");
      setEmailParaRemover(null);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao remover email");
    },
  });

  const desbloquearMutation = trpc.auth.desbloquearConta.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success("Conta desbloqueada com sucesso!");
      } else {
        toast.error(data.error || "Erro ao desbloquear conta");
      }
      setEmailParaDesbloquear(null);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao desbloquear conta");
    },
  });

  const handleAdicionar = (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    if (!novoEmail) {
      setErro("Digite um email");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(novoEmail)) {
      setErro("Email inválido");
      return;
    }
    adicionarMutation.mutate({ email: novoEmail });
  };

  const handleRemover = () => {
    if (emailParaRemover) {
      removerMutation.mutate({ email: emailParaRemover });
    }
  };

  const handleDesbloquear = () => {
    if (emailParaDesbloquear) {
      desbloquearMutation.mutate({ email: emailParaDesbloquear });
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDF8F5]">
        <Loader2 className="h-8 w-8 animate-spin text-[#722F37]" />
      </div>
    );
  }

  if (!user) {
    setLocation("/login");
    return null;
  }

  const emailsAtivos = emails?.filter(e => e.ativo === 1) || [];
  const emailsInativos = emails?.filter(e => e.ativo === 0) || [];
  const emailsBloqueados = emailsAtivos.filter(e => e.isLocked);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FDF8F5] to-[#F5E6E0] p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/dashboard")}
            className="text-[#722F37] hover:bg-[#F5E6E0]"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-[#722F37] flex items-center gap-2">
              <ShieldCheck className="h-6 w-6" />
              Emails Autorizados
            </h1>
            <p className="text-gray-600 text-sm">
              Gerencie quem pode acessar o sistema
            </p>
          </div>
        </div>

        {/* Alerta de Contas Bloqueadas */}
        {emailsBloqueados.length > 0 && (
          <Card className="mb-6 shadow-lg border-0 bg-orange-50 border-orange-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-orange-700 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Contas Bloqueadas ({emailsBloqueados.length})
              </CardTitle>
              <CardDescription className="text-orange-600">
                Estas contas foram bloqueadas após múltiplas tentativas de login incorretas.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {emailsBloqueados.map((email) => (
                  <div key={email.id} className="flex items-center justify-between bg-white rounded-lg p-3 border border-orange-200">
                    <div className="flex items-center gap-3">
                      <Lock className="h-5 w-5 text-orange-600" />
                      <div>
                        <p className="font-medium text-gray-800">{email.email}</p>
                        {email.userName && (
                          <p className="text-sm text-gray-500 flex items-center gap-1">
                            <User className="h-3 w-3" /> {email.userName}
                          </p>
                        )}
                        <p className="text-xs text-orange-600">
                          Bloqueado até: {email.lockedUntil ? new Date(email.lockedUntil).toLocaleString('pt-BR') : '-'}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEmailParaDesbloquear(email.email)}
                      className="text-orange-700 border-orange-300 hover:bg-orange-100"
                    >
                      <Unlock className="h-4 w-4 mr-1" />
                      Desbloquear
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Card de Adicionar */}
        <Card className="mb-6 shadow-lg border-0 bg-white/90">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg text-[#722F37] flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Adicionar Novo Email
            </CardTitle>
            <CardDescription>
              Adicione um email para permitir acesso ao sistema. O usuário precisará criar uma senha no primeiro acesso.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdicionar} className="flex gap-3">
              <div className="flex-1">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="email"
                    placeholder="novo@email.com"
                    value={novoEmail}
                    onChange={(e) => {
                      setNovoEmail(e.target.value);
                      setErro("");
                    }}
                    className="pl-10 border-[#E8D5D0] focus:border-[#722F37] focus:ring-[#722F37]"
                    disabled={adicionarMutation.isPending}
                  />
                </div>
                {erro && <p className="text-red-500 text-sm mt-1">{erro}</p>}
              </div>
              <Button
                type="submit"
                className="bg-[#722F37] hover:bg-[#5a252c]"
                disabled={adicionarMutation.isPending}
              >
                {adicionarMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Lista de Emails */}
        <Card className="shadow-lg border-0 bg-white/90">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg text-[#722F37] flex items-center gap-2">
              <Users className="h-5 w-5" />
              Emails Cadastrados
              <Badge variant="secondary" className="ml-2">
                {emailsAtivos.length} ativos
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-[#722F37]" />
              </div>
            ) : emailsAtivos.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Mail className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Nenhum email autorizado cadastrado.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data de Cadastro</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {emailsAtivos.map((email) => (
                    <TableRow key={email.id} className={email.isLocked ? "bg-orange-50" : ""}>
                      <TableCell className="font-medium">{email.email}</TableCell>
                      <TableCell className="text-gray-500">
                        {email.userExists ? (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {email.userName || "Sem nome"}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic">Não cadastrado</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {email.isLocked ? (
                          <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">
                            <Lock className="h-3 w-3 mr-1" />
                            Bloqueado
                          </Badge>
                        ) : email.failedAttempts && email.failedAttempts > 0 ? (
                          <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            {email.failedAttempts} tentativa(s)
                          </Badge>
                        ) : (
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Ativo
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-gray-500">
                        {email.createdAt ? new Date(email.createdAt).toLocaleDateString('pt-BR') : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {email.isLocked && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEmailParaDesbloquear(email.email)}
                              className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                              title="Desbloquear conta"
                            >
                              <Unlock className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEmailParaRemover(email.email)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            title="Remover acesso"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Emails Inativos (se houver) */}
        {emailsInativos.length > 0 && (
          <Card className="mt-6 shadow-lg border-0 bg-white/90 opacity-75">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg text-gray-500 flex items-center gap-2">
                Emails Inativos
                <Badge variant="outline" className="ml-2">
                  {emailsInativos.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableBody>
                  {emailsInativos.map((email) => (
                    <TableRow key={email.id} className="opacity-60">
                      <TableCell className="font-medium">{email.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-gray-500">
                          Inativo
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-400">
                        {email.createdAt ? new Date(email.createdAt).toLocaleDateString('pt-BR') : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialog de Confirmação de Remoção */}
      <Dialog open={!!emailParaRemover} onOpenChange={() => setEmailParaRemover(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[#722F37]">Remover Acesso</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja remover o acesso do email <strong>{emailParaRemover}</strong>?
              <br />
              O usuário não poderá mais fazer login no sistema.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEmailParaRemover(null)}
              disabled={removerMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemover}
              disabled={removerMutation.isPending}
            >
              {removerMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Remover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Desbloqueio */}
      <Dialog open={!!emailParaDesbloquear} onOpenChange={() => setEmailParaDesbloquear(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-orange-700 flex items-center gap-2">
              <Unlock className="h-5 w-5" />
              Desbloquear Conta
            </DialogTitle>
            <DialogDescription>
              Tem certeza que deseja desbloquear a conta <strong>{emailParaDesbloquear}</strong>?
              <br />
              O usuário poderá tentar fazer login novamente imediatamente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEmailParaDesbloquear(null)}
              disabled={desbloquearMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleDesbloquear}
              disabled={desbloquearMutation.isPending}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {desbloquearMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Unlock className="h-4 w-4 mr-2" />
              )}
              Desbloquear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
