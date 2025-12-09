import { useState, useMemo } from "react";
import GestantesLayout from "@/components/GestantesLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye,
  Filter
} from "lucide-react";
import { toast } from "sonner";
import FormularioGestante from "@/components/FormularioGestante";
import DetalhesGestante from "@/components/DetalhesGestante";
import { AlertasPartosProximos } from "@/components/AlertasPartosProximos";

type SortOption = "nome" | "dpp-dum" | "dpp-us";

export default function Dashboard() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [viewingId, setViewingId] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("nome");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTipoParto, setFilterTipoParto] = useState<string>("todos");
  const [filterMedico, setFilterMedico] = useState<string>("todos");
  const [filterPlano, setFilterPlano] = useState<string>("todos");
  
  const { data: gestantes, isLoading } = trpc.gestantes.list.useQuery();
  const { data: medicos = [] } = trpc.medicos.listar.useQuery();
  const { data: planos = [] } = trpc.planosSaude.listar.useQuery();
  const utils = trpc.useUtils();

  const deleteMutation = trpc.gestantes.delete.useMutation({
    onSuccess: () => {
      toast.success("Gestante removida com sucesso!");
      utils.gestantes.list.invalidate();
    },
    onError: (error) => {
      toast.error("Erro ao remover gestante: " + error.message);
    },
  });

  const sortedGestantes = useMemo(() => {
    if (!gestantes) return [];
    
    const filtered = gestantes.filter(g => {
      const matchNome = g.nome.toLowerCase().includes(searchTerm.toLowerCase());
      const matchTipoParto = filterTipoParto === "todos" || g.tipoPartoDesejado === filterTipoParto;
      const matchMedico = filterMedico === "todos" || g.medicoId?.toString() === filterMedico;
      const matchPlano = filterPlano === "todos" || g.planoSaudeId?.toString() === filterPlano;
      
      return matchNome && matchTipoParto && matchMedico && matchPlano;
    });
    
    const sorted = [...filtered];
    
    switch (sortBy) {
      case "nome":
        return sorted.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
      
      case "dpp-dum":
        return sorted.sort((a, b) => {
          const dppA = a.calculado?.dpp ? new Date(a.calculado.dpp).getTime() : Infinity;
          const dppB = b.calculado?.dpp ? new Date(b.calculado.dpp).getTime() : Infinity;
          return dppA - dppB;
        });
      
      case "dpp-us":
        return sorted.sort((a, b) => {
          const calcDppUS = (g: typeof gestantes[0]) => {
            if (g.igUltrassomSemanas === null || g.igUltrassomDias === null || !g.dataUltrassom) return Infinity;
            const dataUS = new Date(g.dataUltrassom);
            const igUltrassomDias = (g.igUltrassomSemanas * 7) + g.igUltrassomDias;
            const diasRestantes = 280 - igUltrassomDias;
            const dpp = new Date(dataUS);
            dpp.setDate(dpp.getDate() + diasRestantes);
            return dpp.getTime();
          };
          
          return calcDppUS(a) - calcDppUS(b);
        });
      
      default:
        return sorted;
    }
  }, [gestantes, sortBy, searchTerm, filterTipoParto, filterMedico, filterPlano]);

  const handleSuccess = () => {
    setShowForm(false);
    setEditingId(null);
    setViewingId(null);
    utils.gestantes.list.invalidate();
  };

  const handleEdit = (id: number) => {
    setEditingId(id);
    setShowForm(true);
    setViewingId(null);
  };

  const handleView = (id: number) => {
    setViewingId(id);
    setShowForm(false);
    setEditingId(null);
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja remover esta gestante?")) {
      deleteMutation.mutate({ id });
    }
  };

  const getTrimestre = (igDUM: any) => {
    if (!igDUM) return null;
    const semanas = igDUM.semanas;
    if (semanas <= 13) return { nome: "1º Trimestre", cor: "bg-green-100 text-green-800" };
    if (semanas <= 27) return { nome: "2º Trimestre", cor: "bg-blue-100 text-blue-800" };
    return { nome: "3º Trimestre", cor: "bg-orange-100 text-orange-800" };
  };

  if (showForm) {
    return (
      <GestantesLayout>
        <FormularioGestante
          gestanteId={editingId}
          onSuccess={handleSuccess}
          onCancel={() => {
            setShowForm(false);
            setEditingId(null);
          }}
        />
      </GestantesLayout>
    );
  }

  if (viewingId) {
    return (
      <GestantesLayout>
        <DetalhesGestante
          gestanteId={viewingId}
          onClose={() => setViewingId(null)}
          onEdit={() => handleEdit(viewingId)}
        />
      </GestantesLayout>
    );
  }

  return (
    <GestantesLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Gestantes</h2>
            <p className="text-muted-foreground">
              Gerencie todas as gestantes cadastradas
            </p>
          </div>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Gestante
          </Button>
        </div>

        {/* Alertas de Partos Próximos */}
        {gestantes && gestantes.length > 0 && (
          <AlertasPartosProximos gestantes={gestantes} />
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros e Busca
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                <SelectTrigger>
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nome">Nome (A-Z)</SelectItem>
                  <SelectItem value="dpp-dum">DPP pela DUM</SelectItem>
                  <SelectItem value="dpp-us">DPP pelo Ultrassom</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterTipoParto} onValueChange={setFilterTipoParto}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo de parto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os tipos</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="cesariana">Cesárea</SelectItem>
                  <SelectItem value="a_definir">A definir</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterMedico} onValueChange={setFilterMedico}>
                <SelectTrigger>
                  <SelectValue placeholder="Médico" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os médicos</SelectItem>
                  {medicos.map(m => (
                    <SelectItem key={m.id} value={m.id.toString()}>{m.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Carregando gestantes...</p>
              </div>
            ) : sortedGestantes.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-muted-foreground">Nenhuma gestante encontrada</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>IG (DUM)</TableHead>
                    <TableHead>IG (US)</TableHead>
                    <TableHead>DPP</TableHead>
                    <TableHead>Trimestre</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedGestantes.map((g, idx) => {
                    const trimestre = getTrimestre(g.calculado?.igDUM);
                    return (
                      <TableRow key={g.id}>
                        <TableCell className="font-medium">{idx + 1}</TableCell>
                        <TableCell className="font-medium">{g.nome}</TableCell>
                        <TableCell>
                          {g.calculado?.igDUM 
                            ? `${g.calculado.igDUM.semanas}s${g.calculado.igDUM.dias}d`
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {g.calculado?.igUS 
                            ? `${g.calculado.igUS.semanas}s${g.calculado.igUS.dias}d`
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {g.calculado?.dpp 
                            ? new Date(g.calculado.dpp).toLocaleDateString('pt-BR')
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {trimestre && (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${trimestre.cor}`}>
                              {trimestre.nome}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleView(g.id)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(g.id)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(g.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
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
      </div>
    </GestantesLayout>
  );
}
