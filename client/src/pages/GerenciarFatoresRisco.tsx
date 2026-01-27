import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, AlertTriangle, Lock } from "lucide-react";
import { toast } from "sonner";

export default function GerenciarFatoresRisco() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    codigo: "",
    nome: "",
    descricaoPadrao: "",
    permiteTextoLivre: false,
  });

  const utils = trpc.useUtils();
  const { data: opcoes, isLoading } = trpc.opcoesFatoresRisco.list.useQuery();
  
  const createMutation = trpc.opcoesFatoresRisco.create.useMutation({
    onSuccess: () => {
      toast.success("Fator de risco adicionado com sucesso!");
      utils.opcoesFatoresRisco.list.invalidate();
      resetForm();
    },
    onError: (error) => {
      toast.error(`Erro ao adicionar: ${error.message}`);
    },
  });

  const updateMutation = trpc.opcoesFatoresRisco.update.useMutation({
    onSuccess: () => {
      toast.success("Fator de risco atualizado com sucesso!");
      utils.opcoesFatoresRisco.list.invalidate();
      resetForm();
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar: ${error.message}`);
    },
  });

  const deleteMutation = trpc.opcoesFatoresRisco.delete.useMutation({
    onSuccess: () => {
      toast.success("Fator de risco removido com sucesso!");
      utils.opcoesFatoresRisco.list.invalidate();
    },
    onError: (error) => {
      toast.error(`Erro ao remover: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData({
      codigo: "",
      nome: "",
      descricaoPadrao: "",
      permiteTextoLivre: false,
    });
    setEditingId(null);
    setDialogOpen(false);
  };

  const handleSubmit = () => {
    if (!formData.nome.trim()) {
      toast.error("O nome é obrigatório");
      return;
    }

    // Gerar código a partir do nome se não fornecido
    const codigo = formData.codigo.trim() || formData.nome
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "");

    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        nome: formData.nome,
        descricaoPadrao: formData.descricaoPadrao || undefined,
        permiteTextoLivre: formData.permiteTextoLivre ? 1 : 0,
      });
    } else {
      createMutation.mutate({
        codigo,
        nome: formData.nome,
        descricaoPadrao: formData.descricaoPadrao || undefined,
        permiteTextoLivre: formData.permiteTextoLivre ? 1 : 0,
      });
    }
  };

  const handleEdit = (opcao: any) => {
    setFormData({
      codigo: opcao.codigo,
      nome: opcao.nome,
      descricaoPadrao: opcao.descricaoPadrao || "",
      permiteTextoLivre: opcao.permiteTextoLivre === 1,
    });
    setEditingId(opcao.id);
    setDialogOpen(true);
  };

  const handleDelete = (id: number, sistema: number) => {
    if (sistema === 1) {
      toast.error("Não é possível remover itens do sistema");
      return;
    }
    if (confirm("Tem certeza que deseja remover este fator de risco?")) {
      deleteMutation.mutate({ id });
    }
  };

  // Ordenar alfabeticamente
  const opcoesOrdenadas = opcoes?.slice().sort((a, b) => 
    a.nome.localeCompare(b.nome, 'pt-BR')
  ) || [];

  return (
    <div className="container py-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                Gerenciar Fatores de Risco
              </CardTitle>
              <CardDescription>
                Adicione, edite ou remova opções de fatores de risco que aparecem no cadastro de gestantes e no cartão de pré-natal.
              </CardDescription>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Fator de Risco
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingId ? "Editar Fator de Risco" : "Novo Fator de Risco"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingId 
                      ? "Atualize as informações do fator de risco."
                      : "Preencha as informações do novo fator de risco."}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome *</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      placeholder="Ex: Anemia Falciforme"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="descricaoPadrao">Descrição Padrão (opcional)</Label>
                    <Input
                      id="descricaoPadrao"
                      value={formData.descricaoPadrao}
                      onChange={(e) => setFormData({ ...formData, descricaoPadrao: e.target.value })}
                      placeholder="Descrição que aparece por padrão"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="permiteTextoLivre"
                      checked={formData.permiteTextoLivre}
                      onCheckedChange={(checked: boolean) => setFormData({ ...formData, permiteTextoLivre: checked })}
                    />
                    <Label htmlFor="permiteTextoLivre">
                      Permite texto livre adicional
                    </Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Quando ativado, permite que o usuário adicione uma descrição personalizada ao selecionar este fator de risco.
                  </p>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={resetForm}>
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleSubmit}
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    {editingId ? "Salvar" : "Adicionar"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando...
            </div>
          ) : opcoesOrdenadas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum fator de risco cadastrado.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Descrição Padrão</TableHead>
                  <TableHead className="text-center">Texto Livre</TableHead>
                  <TableHead className="text-center">Tipo</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {opcoesOrdenadas.map((opcao) => (
                  <TableRow key={opcao.id}>
                    <TableCell className="font-medium">{opcao.nome}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {opcao.descricaoPadrao || "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      {opcao.permiteTextoLivre === 1 ? (
                        <Badge variant="secondary">Sim</Badge>
                      ) : (
                        <span className="text-muted-foreground">Não</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {opcao.sistema === 1 ? (
                        <Badge variant="outline" className="gap-1">
                          <Lock className="h-3 w-3" />
                          Sistema
                        </Badge>
                      ) : (
                        <Badge variant="default">Personalizado</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(opcao)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(opcao.id, opcao.sistema)}
                          disabled={opcao.sistema === 1}
                          className={opcao.sistema === 1 ? "opacity-50 cursor-not-allowed" : "text-destructive hover:text-destructive"}
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
    </div>
  );
}
