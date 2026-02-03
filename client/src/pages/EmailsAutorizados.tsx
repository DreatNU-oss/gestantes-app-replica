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
  Users
} from "lucide-react";
import { toast } from "sonner";

export default function EmailsAutorizados() {
  const [, setLocation] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [novoEmail, setNovoEmail] = useState("");
  const [emailParaRemover, setEmailParaRemover] = useState<string | null>(null);
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
                    <TableHead>Status</TableHead>
                    <TableHead>Data de Cadastro</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {emailsAtivos.map((email) => (
                    <TableRow key={email.id}>
                      <TableCell className="font-medium">{email.email}</TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Ativo
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-500">
                        {email.createdAt ? new Date(email.createdAt).toLocaleDateString('pt-BR') : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEmailParaRemover(email.email)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
    </div>
  );
}
