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
import { Plus, Edit, Trash2, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function GerenciarMedicos() {
  const [, setLocation] = useLocation();
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [nome, setNome] = useState("");
  const [ordem, setOrdem] = useState("");

  const { data: medicos = [], isLoading } = trpc.medicos.listar.useQuery();
  const utils = trpc.useUtils();

  const createMutation = trpc.medicos.criar.useMutation({
    onSuccess: () => {
      toast.success("Médico criado com sucesso!");
      utils.medicos.listar.invalidate();
      handleClose();
    },
    onError: (error) => {
      toast.error("Erro ao criar médico: " + error.message);
    },
  });

  const updateMutation = trpc.medicos.atualizar.useMutation({
    onSuccess: () => {
      toast.success("Médico atualizado com sucesso!");
      utils.medicos.listar.invalidate();
      handleClose();
    },
    onError: (error) => {
      toast.error("Erro ao atualizar médico: " + error.message);
    },
  });

  const deleteMutation = trpc.medicos.deletar.useMutation({
    onSuccess: () => {
      toast.success("Médico removido com sucesso!");
      utils.medicos.listar.invalidate();
    },
    onError: (error) => {
      toast.error("Erro ao remover médico: " + error.message);
    },
  });

  const handleClose = () => {
    setShowDialog(false);
    setEditingId(null);
    setNome("");
    setOrdem("");
  };

  const handleEdit = (medico: any) => {
    setEditingId(medico.id);
    setNome(medico.nome);
    setOrdem(medico.ordem?.toString() || "");
    setShowDialog(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja remover este médico?")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      nome,
      ordem: ordem ? parseInt(ordem) : undefined,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <GestantesLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/dashboard")}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h2 className="text-3xl font-bold text-foreground">Gerenciar Médicos</h2>
            <p className="text-muted-foreground">
              Cadastre e gerencie os médicos responsáveis
            </p>
          </div>
          <Button onClick={() => setShowDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Médico
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Médicos Cadastrados</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Carregando...</p>
              </div>
            ) : medicos.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-muted-foreground">Nenhum médico cadastrado</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ordem</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {medicos.map((medico) => (
                    <TableRow key={medico.id}>
                      <TableCell className="w-20">{medico.ordem || "-"}</TableCell>
                      <TableCell className="font-medium">{medico.nome}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(medico)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(medico.id)}
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
                {editingId ? "Editar Médico" : "Novo Médico"}
              </DialogTitle>
              <DialogDescription>
                Preencha as informações do médico
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome do Médico *</Label>
                  <Input
                    id="nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    required
                    placeholder="Ex: Dr. João Silva"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ordem">Ordem de Exibição</Label>
                  <Input
                    id="ordem"
                    type="number"
                    value={ordem}
                    onChange={(e) => setOrdem(e.target.value)}
                    placeholder="1, 2, 3..."
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
