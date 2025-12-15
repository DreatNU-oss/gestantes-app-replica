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
  Edit, 
  Trash2, 
  Eye,
  Filter
} from "lucide-react";
import { toast } from "sonner";
import FormularioGestante from "@/components/FormularioGestante";
import DetalhesGestante from "@/components/DetalhesGestante";
import { AlertasPartosProximos } from "@/components/AlertasPartosProximos";
import { AutocompleteGestante } from "@/components/AutocompleteGestante";

type SortOption = "nome" | "dpp-dum" | "dpp-us";

// Função para formatar data de forma segura, evitando problemas de timezone
const formatarDataSegura = (dateValue: Date | string | null | undefined): string => {
  if (!dateValue) return "-";
  
  // Se for string no formato YYYY-MM-DD, parsear manualmente
  if (typeof dateValue === 'string') {
    const [year, month, day] = dateValue.split('T')[0].split('-').map(Number);
    if (year && month && day) {
      return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
    }
  }
  
  // Se for Date object, usar getUTC para evitar shift de timezone
  const date = new Date(dateValue);
  if (isNaN(date.getTime())) return "-";
  
  const dia = String(date.getUTCDate()).padStart(2, '0');
  const mes = String(date.getUTCMonth() + 1).padStart(2, '0');
  const ano = date.getUTCFullYear();
  return `${dia}/${mes}/${ano}`;
};

export default function Dashboard() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [viewingId, setViewingId] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("nome");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTipoParto, setFilterTipoParto] = useState<string>("todos");
  const [filterMedico, setFilterMedico] = useState<string>("todos");
  const [filterPlano, setFilterPlano] = useState<string>("todos");
  const [filterDppInicio, setFilterDppInicio] = useState<string>("");
  const [filterDppFim, setFilterDppFim] = useState<string>("");
  
  const { data: gestantes, isLoading } = trpc.gestantes.list.useQuery({ searchTerm });
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
      // Busca por nome já feita no backend (com normalização de acentos)
      const matchTipoParto = filterTipoParto === "todos" || g.tipoPartoDesejado === filterTipoParto;
      const matchMedico = filterMedico === "todos" || g.medicoId?.toString() === filterMedico;
      const matchPlano = filterPlano === "todos" || g.planoSaudeId?.toString() === filterPlano;
      
      let matchDppPeriodo = true;
      if (filterDppInicio || filterDppFim) {
        const dpp = g.calculado?.dpp ? new Date(g.calculado.dpp) : null;
        if (dpp) {
          if (filterDppInicio) {
            const inicio = new Date(filterDppInicio);
            if (dpp < inicio) matchDppPeriodo = false;
          }
          if (filterDppFim) {
            const fim = new Date(filterDppFim);
            if (dpp > fim) matchDppPeriodo = false;
          }
        } else {
          matchDppPeriodo = false;
        }
      }
      
      return matchTipoParto && matchMedico && matchPlano && matchDppPeriodo;
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
            dpp.setDate(dpp.getDate() + diasRestantes + 1); // +1 para contar o dia do US
            return dpp.getTime();
          };
          
          return calcDppUS(a) - calcDppUS(b);
        });
      
      default:
        return sorted;
    }
  }, [gestantes, sortBy, filterTipoParto, filterMedico, filterPlano, filterDppInicio, filterDppFim, searchTerm]);

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

  const getTrimestre = (semanas: number) => {
    if (semanas <= 13) return { nome: "1º Tri", cor: "bg-green-100 text-green-700 border border-green-300" };
    if (semanas <= 27) return { nome: "2º Tri", cor: "bg-blue-100 text-blue-700 border border-blue-300" };
    return { nome: "3º Tri", cor: "bg-pink-100 text-pink-700 border border-pink-300" };
  };

  const formatIGBadge = (ig: { semanas: number; dias: number } | null | undefined) => {
    if (!ig) return null;
    const trimestre = getTrimestre(ig.semanas);
    return {
      text: `${ig.semanas}s ${ig.dias}d`,
      trimestre: trimestre.nome,
      cor: trimestre.cor
    };
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
          <AlertasPartosProximos gestantes={gestantes} medicos={medicos} />
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros e Busca
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <AutocompleteGestante
                gestantes={gestantes || []}
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Buscar por nome..."
              />
              
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
                  <SelectItem value="todos">Tipo de parto</SelectItem>
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
                  <SelectItem value="todos">Médico</SelectItem>
                  {medicos.map(m => (
                    <SelectItem key={m.id} value={m.id.toString()}>{m.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterPlano} onValueChange={setFilterPlano}>
                <SelectTrigger>
                  <SelectValue placeholder="Plano de Saúde" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Plano de saúde</SelectItem>
                  {planos.map(p => (
                    <SelectItem key={p.id} value={p.id.toString()}>{p.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-muted-foreground">Período de DPP:</span>
              <Input
                type="date"
                value={filterDppInicio}
                onChange={(e) => setFilterDppInicio(e.target.value)}
                className="w-auto"
              />
              <span className="text-sm text-muted-foreground">até</span>
              <Input
                type="date"
                value={filterDppFim}
                onChange={(e) => setFilterDppFim(e.target.value)}
                className="w-auto"
              />
            </div>
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
                    <TableHead>DPP (DUM)</TableHead>
                    <TableHead>IG (US)</TableHead>
                    <TableHead>DPP (US)</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedGestantes.map((g, idx) => {
                    const igDumBadge = formatIGBadge(g.calculado?.igDUM);
                    const igUsBadge = formatIGBadge(g.calculado?.igUS);
                    return (
                      <TableRow key={g.id}>
                        <TableCell className="font-medium">{idx + 1}</TableCell>
                        <TableCell className="font-medium">{g.nome}</TableCell>
                        <TableCell>
                          {igDumBadge ? (
                            <span className={`inline-block px-3 py-1.5 rounded text-xs font-medium ${igDumBadge.cor}`}>
                              {igDumBadge.text}
                              <br />
                              <span className="text-[10px]">{igDumBadge.trimestre}</span>
                            </span>
                          ) : "-"}
                        </TableCell>
                        <TableCell>
                          {formatarDataSegura(g.calculado?.dpp)}
                        </TableCell>
                        <TableCell>
                          {igUsBadge ? (
                            <span className={`inline-block px-3 py-1.5 rounded text-xs font-medium ${igUsBadge.cor}`}>
                              {igUsBadge.text}
                              <br />
                              <span className="text-[10px]">{igUsBadge.trimestre}</span>
                            </span>
                          ) : "-"}
                        </TableCell>
                        <TableCell>
                          {formatarDataSegura(g.calculado?.dppUS)}
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
