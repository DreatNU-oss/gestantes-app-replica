import { useState } from "react";
import GestantesLayout from "@/components/GestantesLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputComHistorico } from "@/components/InputComHistorico";
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
import { Plus, Edit, Trash2, ArrowLeft, Star, Scissors } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function GerenciarProcedimentos() {
  const [, setLocation] = useLocation();
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [nome, setNome] = useState("");

  const { data: procedimentos = [], isLoading } = trpc.procedimentos.listarTodos.useQuery();
  const utils = trpc.useUtils();

  const createMutation = trpc.procedimentos.criar.useMutation({
    onSuccess: () => {
      toast.success("Procedimento criado com sucesso!");
      utils.procedimentos.listarTodos.invalidate();
      utils.procedimentos.listar.invalidate();
      handleClose();
    },
    onError: (error) => {
      toast.error("Erro ao criar procedimento: " + error.message);
    },
  });

  const updateMutation = trpc.procedimentos.atualizar.useMutation({
    onSuccess: () => {
      toast.success("Procedimento atualizado com sucesso!");
      utils.procedimentos.listarTodos.invalidate();
      utils.procedimentos.listar.invalidate();
      handleClose();
    },
    onError: (error) => {
      toast.error("Erro ao atualizar procedimento: " + error.message);
    },
  });

  const deleteMutation = trpc.procedimentos.deletar.useMutation({
    onSuccess: () => {
      toast.success("Procedimento removido com sucesso!");
      utils.procedimentos.listarTodos.invalidate();
      utils.procedimentos.listar.invalidate();
    },
    onError: (error) => {
      toast.error("Erro ao remover procedimento: " + error.message);
    },
  });

  const toggleAtivoMutation = trpc.procedimentos.toggleAtivo.useMutation({
    onSuccess: () => {
      toast.success("Status do procedimento atualizado!");
      utils.procedimentos.listarTodos.invalidate();
      utils.procedimentos.listar.invalidate();
    },
    onError: (error) => {
      toast.error("Erro ao atualizar status: " + error.message);
    },
  });

  const setPadraoMutation = trpc.procedimentos.setPadrao.useMutation({
    onSuccess: () => {
      toast.success("Procedimento definido como padrão!");
      utils.procedimentos.listarTodos.invalidate();
      utils.procedimentos.listar.invalidate();
    },
    onError: (error) => {
      toast.error("Erro ao definir padrão: " + error.message);
    },
  });

  const removePadraoMutation = trpc.procedimentos.removePadrao.useMutation({
    onSuccess: () => {
      toast.success("Procedimento padrão removido!");
      utils.procedimentos.listarTodos.invalidate();
      utils.procedimentos.listar.invalidate();
    },
    onError: (error) => {
      toast.error("Erro ao remover padrão: " + error.message);
    },
  });

  const handleClose = () => {
    setShowDialog(false);
    setEditingId(null);
    setNome("");
  };

  const handleEdit = (proc: any) => {
    setEditingId(proc.id);
    setNome(proc.nome);
    setShowDialog(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja remover este procedimento?")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleTogglePadrao = (proc: any) => {
    if (proc.padrao === 1) {
      removePadraoMutation.mutate();
    } else {
      setPadraoMutation.mutate({ id: proc.id });
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
            <h2 className="text-3xl font-bold text-foreground">Gerenciar Procedimentos</h2>
            <p className="text-muted-foreground">
              Cadastre e gerencie os procedimentos cirúrgicos. Clique na estrela para definir o procedimento padrão.
            </p>
          </div>
          <Button onClick={() => setShowDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Procedimento
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scissors className="h-5 w-5" />
              Procedimentos Cadastrados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Carregando...</p>
              </div>
            ) : procedimentos.length === 0 ? (
              <div className="p-8 text-center">
                <Scissors className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">Nenhum procedimento cadastrado</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Clique em "Novo Procedimento" para adicionar o primeiro procedimento.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead className="text-center">Padrão</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {procedimentos.map((proc) => (
                    <TableRow key={proc.id} className={proc.ativo === 0 ? "opacity-50" : ""}>
                      <TableCell className="font-medium">
                        {proc.nome}
                        {proc.padrao === 1 && (
                          <span className="ml-2 text-xs text-amber-600 font-semibold">(Padrão)</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handleTogglePadrao(proc)}
                          disabled={proc.ativo === 0 || setPadraoMutation.isPending || removePadraoMutation.isPending}
                          title={proc.padrao === 1 ? "Remover padrão" : "Definir como padrão"}
                        >
                          <Star
                            className={`h-5 w-5 ${
                              proc.padrao === 1
                                ? "fill-amber-400 text-amber-400"
                                : "text-muted-foreground hover:text-amber-400"
                            }`}
                          />
                        </Button>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant={proc.ativo === 1 ? "default" : "outline"}
                          size="sm"
                          className="text-xs h-7 min-w-[70px]"
                          onClick={() => toggleAtivoMutation.mutate({ id: proc.id })}
                        >
                          {proc.ativo === 1 ? "Ativo" : "Inativo"}
                        </Button>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(proc)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(proc.id)}
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
                {editingId ? "Editar Procedimento" : "Novo Procedimento"}
              </DialogTitle>
              <DialogDescription>
                Preencha o nome do procedimento cirúrgico
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome do Procedimento *</Label>
                  <InputComHistorico
                    tipo="gerenciar_proc_nome"
                    id="nome"
                    value={nome}
                    onChange={(v) => setNome(v)}
                    required
                    placeholder="Ex: Cesárea sem DIU, Cesárea + DIU, Histerec aberta..."
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
