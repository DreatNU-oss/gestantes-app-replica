import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Building2,
  Plus,
  Pencil,
  Users,
  Baby,
  Mail,
  ArrowLeft,
  Upload,
  Trash2,
  Shield,
  ShieldOff,
  Eye,
  Image,
} from "lucide-react";

type ClinicaComStats = {
  id: number;
  codigo: string;
  nome: string;
  logoUrl: string | null;
  integracaoApiAtiva: number;
  ativa: number;
  createdAt: Date;
  updatedAt: Date;
  totalUsuarios: number;
  totalGestantes: number;
};

export default function AdminClinicas() {
  const { loading, user } = useAuth();
  const [, setLocation] = useLocation();
  const isOwnerQuery = trpc.adminClinicas.isOwner.useQuery(undefined, { enabled: !!user });
  
  // State
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showUsersDialog, setShowUsersDialog] = useState(false);
  const [showEmailsDialog, setShowEmailsDialog] = useState(false);
  const [selectedClinica, setSelectedClinica] = useState<ClinicaComStats | null>(null);
  const [novoNome, setNovoNome] = useState("");
  const [novoEmail, setNovoEmail] = useState("");
  const [editNome, setEditNome] = useState("");
  const [editIntegracao, setEditIntegracao] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Queries
  const clinicasQuery = trpc.adminClinicas.listar.useQuery(undefined, {
    enabled: isOwnerQuery.data?.isOwner === true,
  });
  const usuariosQuery = trpc.adminClinicas.listarUsuarios.useQuery(
    { clinicaId: selectedClinica?.id || 0 },
    { enabled: !!selectedClinica && showUsersDialog }
  );
  const emailsQuery = trpc.adminClinicas.listarEmailsAutorizados.useQuery(
    { clinicaId: selectedClinica?.id || 0 },
    { enabled: !!selectedClinica && showEmailsDialog }
  );

  // Mutations
  const utils = trpc.useUtils();
  const criarMutation = trpc.adminClinicas.criar.useMutation({
    onSuccess: (data) => {
      toast.success(`Clínica criada com código ${data.codigo}`);
      utils.adminClinicas.listar.invalidate();
      setShowCreateDialog(false);
      setNovoNome("");
    },
    onError: (err) => toast.error(err.message),
  });

  const atualizarMutation = trpc.adminClinicas.atualizar.useMutation({
    onSuccess: () => {
      toast.success("Clínica atualizada com sucesso!");
      utils.adminClinicas.listar.invalidate();
      setShowEditDialog(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const toggleAtivaMutation = trpc.adminClinicas.toggleAtiva.useMutation({
    onSuccess: () => {
      toast.success("Status da clínica alterado!");
      utils.adminClinicas.listar.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const adicionarEmailMutation = trpc.adminClinicas.adicionarEmailAutorizado.useMutation({
    onSuccess: () => {
      toast.success("Email autorizado adicionado!");
      utils.adminClinicas.listarEmailsAutorizados.invalidate();
      setNovoEmail("");
    },
    onError: (err) => toast.error(err.message),
  });

  const removerEmailMutation = trpc.adminClinicas.removerEmailAutorizado.useMutation({
    onSuccess: () => {
      toast.success("Email removido!");
      utils.adminClinicas.listarEmailsAutorizados.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const uploadLogoMutation = trpc.adminClinicas.uploadLogo.useMutation({
    onSuccess: () => {
      toast.success("Logo atualizado com sucesso!");
      utils.adminClinicas.listar.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  // Handlers
  const handleCriar = () => {
    if (!novoNome.trim()) {
      toast.error("Informe o nome da clínica.");
      return;
    }
    criarMutation.mutate({ nome: novoNome.trim() });
  };

  const handleEditar = () => {
    if (!selectedClinica || !editNome.trim()) return;
    atualizarMutation.mutate({
      id: selectedClinica.id,
      nome: editNome.trim(),
      integracaoApiAtiva: editIntegracao,
    });
  };

  const handleOpenEdit = (clinica: ClinicaComStats) => {
    setSelectedClinica(clinica);
    setEditNome(clinica.nome);
    setEditIntegracao(clinica.integracaoApiAtiva === 1);
    setShowEditDialog(true);
  };

  const handleOpenUsers = (clinica: ClinicaComStats) => {
    setSelectedClinica(clinica);
    setShowUsersDialog(true);
  };

  const handleOpenEmails = (clinica: ClinicaComStats) => {
    setSelectedClinica(clinica);
    setShowEmailsDialog(true);
  };

  const handleAdicionarEmail = () => {
    if (!selectedClinica || !novoEmail.trim()) return;
    adicionarEmailMutation.mutate({ clinicaId: selectedClinica.id, email: novoEmail.trim().toLowerCase() });
  };

  const handleUploadLogo = async (clinicaId: number, file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      toast.error("O arquivo deve ter no máximo 2MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      uploadLogoMutation.mutate({
        clinicaId,
        fileBase64: base64,
        fileName: file.name,
        contentType: file.type,
      });
    };
    reader.readAsDataURL(file);
  };

  // Loading / Auth
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    setLocation("/login");
    return null;
  }

  if (isOwnerQuery.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isOwnerQuery.data?.isOwner) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <ShieldOff className="h-16 w-16 text-muted-foreground" />
        <h1 className="text-2xl font-bold text-foreground">Acesso Restrito</h1>
        <p className="text-muted-foreground">Apenas o proprietário do sistema pode acessar esta página.</p>
        <Button onClick={() => setLocation("/dashboard")} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar ao Dashboard
        </Button>
      </div>
    );
  }

  const clinicas = clinicasQuery.data || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Dashboard
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold">Painel Administrativo - Clínicas</h1>
          </div>
          <div className="ml-auto">
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Clínica
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container py-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Building2 className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{clinicas.length}</p>
                  <p className="text-sm text-muted-foreground">Clínicas Cadastradas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{clinicas.reduce((acc, c) => acc + c.totalUsuarios, 0)}</p>
                  <p className="text-sm text-muted-foreground">Total de Usuários</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Baby className="h-8 w-8 text-pink-500" />
                <div>
                  <p className="text-2xl font-bold">{clinicas.reduce((acc, c) => acc + c.totalGestantes, 0)}</p>
                  <p className="text-sm text-muted-foreground">Total de Gestantes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Clinic Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {clinicas.map((clinica) => (
            <Card key={clinica.id} className={`relative ${clinica.ativa !== 1 ? 'opacity-60' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {clinica.logoUrl ? (
                      <img
                        src={clinica.logoUrl}
                        alt={clinica.nome}
                        className="h-12 w-12 rounded-lg object-contain border"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <CardTitle className="text-lg">{clinica.nome}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="font-mono">
                          {clinica.codigo}
                        </Badge>
                        {clinica.ativa === 1 ? (
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Ativa</Badge>
                        ) : (
                          <Badge variant="destructive">Inativa</Badge>
                        )}
                        {clinica.integracaoApiAtiva === 1 && (
                          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">API Ativa</Badge>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                  <Switch
                    checked={clinica.ativa === 1}
                    onCheckedChange={(checked) =>
                      toggleAtivaMutation.mutate({ id: clinica.id, ativa: checked })
                    }
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-1.5">
                    <Users className="h-4 w-4" />
                    <span>{clinica.totalUsuarios} usuário(s)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Baby className="h-4 w-4" />
                    <span>{clinica.totalGestantes} gestante(s)</span>
                  </div>
                </div>
                <Separator className="mb-4" />
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleOpenEdit(clinica)}>
                    <Pencil className="h-3.5 w-3.5 mr-1.5" />
                    Editar
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleOpenUsers(clinica)}>
                    <Users className="h-3.5 w-3.5 mr-1.5" />
                    Usuários
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleOpenEmails(clinica)}>
                    <Mail className="h-3.5 w-3.5 mr-1.5" />
                    Emails
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedClinica(clinica);
                      fileInputRef.current?.click();
                    }}
                  >
                    <Image className="h-3.5 w-3.5 mr-1.5" />
                    Logo
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {clinicas.length === 0 && !clinicasQuery.isLoading && (
          <Card className="py-12">
            <CardContent className="flex flex-col items-center gap-4">
              <Building2 className="h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">Nenhuma clínica cadastrada.</p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeira Clínica
              </Button>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Hidden file input for logo upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && selectedClinica) {
            handleUploadLogo(selectedClinica.id, file);
          }
          e.target.value = "";
        }}
      />

      {/* Dialog: Criar Clínica */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Clínica</DialogTitle>
            <DialogDescription>
              Preencha os dados para criar uma nova clínica. O código será gerado automaticamente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome da Clínica</Label>
              <Input
                id="nome"
                placeholder="Ex: Clínica São Lucas"
                value={novoNome}
                onChange={(e) => setNovoNome(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCriar()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCriar} disabled={criarMutation.isPending}>
              {criarMutation.isPending ? "Criando..." : "Criar Clínica"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Editar Clínica */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Clínica</DialogTitle>
            <DialogDescription>
              Código: <span className="font-mono font-bold">{selectedClinica?.codigo}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editNome">Nome da Clínica</Label>
              <Input
                id="editNome"
                value={editNome}
                onChange={(e) => setEditNome(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Integração API (Mapa Cirúrgico)</Label>
                <p className="text-sm text-muted-foreground">
                  Permite enviar cesáreas para o sistema administrativo
                </p>
              </div>
              <Switch
                checked={editIntegracao}
                onCheckedChange={setEditIntegracao}
              />
            </div>
            {selectedClinica?.logoUrl && (
              <div className="space-y-2">
                <Label>Logo Atual</Label>
                <div className="flex items-center gap-3">
                  <img
                    src={selectedClinica.logoUrl}
                    alt="Logo"
                    className="h-16 w-auto rounded-lg border object-contain"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      atualizarMutation.mutate({
                        id: selectedClinica.id,
                        logoUrl: null,
                      });
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                    Remover
                  </Button>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditar} disabled={atualizarMutation.isPending}>
              {atualizarMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Usuários da Clínica */}
      <Dialog open={showUsersDialog} onOpenChange={setShowUsersDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Usuários - {selectedClinica?.nome}
            </DialogTitle>
            <DialogDescription>
              Código: <span className="font-mono font-bold">{selectedClinica?.codigo}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-96 overflow-auto">
            {usuariosQuery.isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
              </div>
            ) : (usuariosQuery.data?.length || 0) === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Nenhum usuário cadastrado nesta clínica.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Perfil</TableHead>
                    <TableHead>Último Acesso</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usuariosQuery.data?.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.name || "—"}</TableCell>
                      <TableCell className="text-sm">{u.email || "—"}</TableCell>
                      <TableCell>
                        <Badge variant={u.role === "admin" ? "default" : "outline"}>
                          {u.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {u.lastSignedIn
                          ? new Date(u.lastSignedIn).toLocaleDateString("pt-BR")
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Emails Autorizados da Clínica */}
      <Dialog open={showEmailsDialog} onOpenChange={setShowEmailsDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Emails Autorizados - {selectedClinica?.nome}
            </DialogTitle>
            <DialogDescription>
              Código: <span className="font-mono font-bold">{selectedClinica?.codigo}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Add email form */}
            <div className="flex gap-2">
              <Input
                placeholder="novo@email.com"
                value={novoEmail}
                onChange={(e) => setNovoEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdicionarEmail()}
              />
              <Button
                onClick={handleAdicionarEmail}
                disabled={adicionarEmailMutation.isPending || !novoEmail.trim()}
              >
                <Plus className="h-4 w-4 mr-1" />
                Adicionar
              </Button>
            </div>

            <Separator />

            {/* Email list */}
            <div className="max-h-72 overflow-auto space-y-2">
              {emailsQuery.isLoading ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                </div>
              ) : (emailsQuery.data?.length || 0) === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  <Mail className="h-6 w-6 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhum email autorizado.</p>
                </div>
              ) : (
                emailsQuery.data?.map((emailAuth) => (
                  <div
                    key={emailAuth.id}
                    className="flex items-center justify-between p-2 rounded-lg border"
                  >
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{emailAuth.email}</span>
                      {emailAuth.ativo === 1 ? (
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700">Ativo</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs bg-red-50 text-red-700">Inativo</Badge>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => removerEmailMutation.mutate({ email: emailAuth.email })}
                      disabled={removerEmailMutation.isPending}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
