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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  User,
  Shield,
  Stethoscope,
  ClipboardList,
  Phone,
  Check,
  X
} from "lucide-react";
import { toast } from "sonner";

const ROLE_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string; bgColor: string }> = {
  admin: { 
    label: "Administrador", 
    icon: <Shield className="h-3 w-3" />, 
    color: "text-purple-700", 
    bgColor: "bg-purple-100" 
  },
  obstetra: { 
    label: "Obstetra", 
    icon: <Stethoscope className="h-3 w-3" />, 
    color: "text-blue-700", 
    bgColor: "bg-blue-100" 
  },
  secretaria: { 
    label: "Secretária", 
    icon: <ClipboardList className="h-3 w-3" />, 
    color: "text-amber-700", 
    bgColor: "bg-amber-100" 
  },
};

export default function EmailsAutorizados() {
  const [, setLocation] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [novoEmail, setNovoEmail] = useState("");
  const [novoRole, setNovoRole] = useState<"admin" | "obstetra" | "secretaria">("obstetra");
  const [emailParaRemover, setEmailParaRemover] = useState<string | null>(null);
  const [emailParaDesbloquear, setEmailParaDesbloquear] = useState<string | null>(null);
  const [erro, setErro] = useState("");
  const [editandoTelefone, setEditandoTelefone] = useState<number | null>(null);
  const [telefoneTemp, setTelefoneTemp] = useState("");

  const { data: emails, isLoading, refetch } = trpc.auth.listarEmailsAutorizados.useQuery();

  const adicionarMutation = trpc.auth.adicionarEmailAutorizado.useMutation({
    onSuccess: () => {
      toast.success("Email autorizado com sucesso!");
      setNovoEmail("");
      setNovoRole("obstetra");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao adicionar email");
    },
  });

  const atualizarRoleMutation = trpc.auth.atualizarRoleEmail.useMutation({
    onSuccess: () => {
      toast.success("Tipo de usuário atualizado!");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar tipo de usuário");
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

  const atualizarTelefoneMutation = trpc.auth.atualizarTelefoneUsuario.useMutation({
    onSuccess: () => {
      toast.success("Telefone atualizado com sucesso!");
      setEditandoTelefone(null);
      setTelefoneTemp("");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar telefone");
    },
  });

  const handleSalvarTelefone = (userId: number) => {
    atualizarTelefoneMutation.mutate({ userId, telefone: telefoneTemp || null });
  };

  const handleEditarTelefone = (userId: number, telefoneAtual: string | null) => {
    setEditandoTelefone(userId);
    setTelefoneTemp(telefoneAtual || "");
  };

  const handleCancelarTelefone = () => {
    setEditandoTelefone(null);
    setTelefoneTemp("");
  };

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
    adicionarMutation.mutate({ email: novoEmail, role: novoRole });
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

  const handleRoleChange = (email: string, newRole: "admin" | "obstetra" | "secretaria") => {
    atualizarRoleMutation.mutate({ email, role: newRole });
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
      <div className="max-w-5xl mx-auto">
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
              Gerencie quem pode acessar o sistema e defina o tipo de cada usuário
            </p>
          </div>
        </div>

        {/* Legenda de Tipos */}
        <Card className="mb-6 shadow-lg border-0 bg-white/90">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-600">Tipos de Usuário</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-purple-50 border border-purple-200">
                <Shield className="h-5 w-5 text-purple-700 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-purple-700">Administrador</p>
                  <p className="text-xs text-purple-600">Acesso total incluindo Configurações. 1 por clínica.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
                <Stethoscope className="h-5 w-5 text-blue-700 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-blue-700">Obstetra</p>
                  <p className="text-xs text-blue-600">Acesso total exceto Configurações.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
                <ClipboardList className="h-5 w-5 text-amber-700 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-amber-700">Secretária</p>
                  <p className="text-xs text-amber-600">Gestantes, Marcos, Previsão de Parto, Agendamento, Estatísticas e cadastro.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

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
              Adicione um email e defina o tipo de acesso. O usuário precisará criar uma senha no primeiro acesso.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdicionar} className="flex gap-3 flex-wrap md:flex-nowrap">
              <div className="flex-1 min-w-[200px]">
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
              <Select value={novoRole} onValueChange={(v) => setNovoRole(v as any)}>
                <SelectTrigger className="w-[180px] border-[#E8D5D0]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">
                    <span className="flex items-center gap-2">
                      <Shield className="h-3 w-3 text-purple-700" />
                      Administrador
                    </span>
                  </SelectItem>
                  <SelectItem value="obstetra">
                    <span className="flex items-center gap-2">
                      <Stethoscope className="h-3 w-3 text-blue-700" />
                      Obstetra
                    </span>
                  </SelectItem>
                  <SelectItem value="secretaria">
                    <span className="flex items-center gap-2">
                      <ClipboardList className="h-3 w-3 text-amber-700" />
                      Secretária
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
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
                    <TableHead>Telefone</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data de Cadastro</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {emailsAtivos.map((email) => {
                    const roleInfo = ROLE_LABELS[(email as any).role || 'obstetra'] || ROLE_LABELS.obstetra;
                    return (
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
                          {email.userExists && (email as any).userId ? (
                            editandoTelefone === (email as any).userId ? (
                              <div className="flex items-center gap-1">
                                <Input
                                  value={telefoneTemp}
                                  onChange={(e) => setTelefoneTemp(e.target.value)}
                                  placeholder="(XX) XXXXX-XXXX"
                                  className="h-7 w-[150px] text-xs border-gray-200"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSalvarTelefone((email as any).userId);
                                    if (e.key === 'Escape') handleCancelarTelefone();
                                  }}
                                  autoFocus
                                />
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleSalvarTelefone((email as any).userId)}
                                  className="h-7 w-7 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                  disabled={atualizarTelefoneMutation.isPending}
                                >
                                  {atualizarTelefoneMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={handleCancelarTelefone}
                                  className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleEditarTelefone((email as any).userId, (email as any).userTelefone)}
                                className="flex items-center gap-1 text-xs text-gray-500 hover:text-[#722F37] cursor-pointer transition-colors"
                                title="Clique para editar telefone"
                              >
                                <Phone className="h-3 w-3" />
                                {(email as any).userTelefone || <span className="italic text-gray-400">Sem telefone</span>}
                              </button>
                            )
                          ) : (
                            <span className="text-gray-400 italic text-xs">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Select 
                            value={(email as any).role || 'obstetra'} 
                            onValueChange={(v) => handleRoleChange(email.email, v as any)}
                            disabled={atualizarRoleMutation.isPending}
                          >
                            <SelectTrigger className="w-[160px] h-8 text-xs border-gray-200">
                              <SelectValue>
                                <span className={`flex items-center gap-1.5 ${roleInfo.color}`}>
                                  {roleInfo.icon}
                                  {roleInfo.label}
                                </span>
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">
                                <span className="flex items-center gap-2 text-purple-700">
                                  <Shield className="h-3 w-3" />
                                  Administrador
                                </span>
                              </SelectItem>
                              <SelectItem value="obstetra">
                                <span className="flex items-center gap-2 text-blue-700">
                                  <Stethoscope className="h-3 w-3" />
                                  Obstetra
                                </span>
                              </SelectItem>
                              <SelectItem value="secretaria">
                                <span className="flex items-center gap-2 text-amber-700">
                                  <ClipboardList className="h-3 w-3" />
                                  Secretária
                                </span>
                              </SelectItem>
                            </SelectContent>
                          </Select>
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
                    );
                  })}
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
