import { useState } from "react";
import GestantesLayout from "@/components/GestantesLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function GerenciarPlanos() {
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [nome, setNome] = useState("");

  const { data: planos = [], isLoading } = trpc.planosSaude.listar.useQuery();
  const utils = trpc.useUtils();

  const createMutation = trpc.planosSaude.criar.useMutation({
    onSuccess: () => {
      toast.success("Plano de saúde criado com sucesso!");
      utils.planosSaude.listar.invalidate();
      handleClose();
    },
    onError: (error) => {
      toast.error("Erro ao criar plano: " + error.message);
    },
  });

  const updateMutation = trpc.planosSaude.atualizar.useMutation({
    onSuccess: () => {
      toast.success("Plano de saúde atualizado com sucesso!");
      utils.planosSaude.listar.invalidate();
      handleClose();
    },
    onError: (error) => {
      toast.error("Erro ao atualizar plano: " + error.message);
    },
  });

  const deleteMutation = trpc.planosSaude.deletar.useMutation({
    onSuccess: () => {
      toast.success("Plano de saúde removido com sucesso!");
      utils.planosSaude.listar.invalidate();
    },
    onError: (error) => {
      toast.error("Erro ao remover plano: " + error.message);
    },
  });

  const handleClose = () => {
    setShowDialog(false);
    setEditingId(null);
    setNome("");
  };

  const handleEdit = (plano: any) => {
    setEditingId(plano.id);
    setNome(plano.nome);
    setShowDialog(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja remover este plano de saúde?")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate({ id: editingId, nome });
    } else {
      createMutation.mutate({ nome });
    }
  };

  return (
    <GestantesLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Gerenciar Planos de Saúde</h2>
            <p className="text-muted-foreground">
              Cadastre e gerencie os planos de saúde
            </p>
          </div>
          <Button onClick={() => setShowDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Plano
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Planos Cadastrados</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Carregando...</p>
              </div>
            ) : planos.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-muted-foreground">Nenhum plano cadastrado</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {planos.map((plano) => (
                    <TableRow key={plano.id}>
                      <TableCell className="font-medium">{plano.nome}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(plano)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(plano.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
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

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Editar Plano de Saúde" : "Novo Plano de Saúde"}
              </DialogTitle>
              <DialogDescription>
                Preencha as informações do plano de saúde
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome do Plano *</Label>
                  <Input
                    id="nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    required
                    placeholder="Ex: Unimed, SulAmérica..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? "Salvando..."
                    : "Salvar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </GestantesLayout>
  );
}
