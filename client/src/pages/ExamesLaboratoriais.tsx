import { useState, useEffect } from "react";
import GestantesLayout from "@/components/GestantesLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { AutocompleteSelect } from "@/components/AutocompleteSelect";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { InterpretarExamesModal } from "@/components/InterpretarExamesModal";
import { Sparkles } from "lucide-react";
import {
  examesSangue,
  examesUrina,
  examesFezes,
  outrosExames,
  type ExameConfig,
} from "@/data/examesConfig";

export default function ExamesLaboratoriais() {
  const [gestanteSelecionada, setGestanteSelecionada] = useState<number | null>(null);
  const [resultados, setResultados] = useState<Record<string, Record<string, string> | string>>({});
  const [modalAberto, setModalAberto] = useState(false);

  const { data: gestantes, isLoading: loadingGestantes } = trpc.gestantes.list.useQuery();

  const gestante = gestantes?.find((g) => g.id === gestanteSelecionada);

  // Query para buscar resultados salvos
  const { data: resultadosSalvos, isLoading: loadingResultados } = trpc.examesLab.buscar.useQuery(
    { gestanteId: gestanteSelecionada! },
    { enabled: !!gestanteSelecionada }
  );

  // Mutation para salvar resultados
  const salvarMutation = trpc.examesLab.salvar.useMutation({
    onSuccess: (data) => {
      alert(`Resultados salvos com sucesso! (${data.count} registros)`);
    },
    onError: (error) => {
      alert(`Erro ao salvar resultados: ${error.message}`);
    },
  });

  // Carregar resultados quando gestante é selecionada
  useEffect(() => {
    if (resultadosSalvos) {
      setResultados(resultadosSalvos);
    }
  }, [resultadosSalvos]);

  const handleResultadoChange = (exame: string, trimestre: string, valor: string) => {
    setResultados((prev) => ({
      ...prev,
      [exame]: {
        ...(typeof prev[exame] === 'object' && prev[exame] !== null ? prev[exame] : {}),
        [trimestre]: valor,
      },
    }));
  };

  const renderExameRow = (exame: ExameConfig) => {
    // Se o exame tem subcampos (ex: TTGO), renderizar múltiplas linhas
    if (exame.subcampos) {
      return (
        <>
          {exame.subcampos.map((subcampo, index) => (
            <TableRow key={`${exame.nome}-${subcampo}`}>
              <TableCell className="font-medium">
                {index === 0 ? exame.nome : ""}
                <span className="text-sm text-gray-500 ml-2">{subcampo}</span>
              </TableCell>
              <TableCell className="text-center">
                {exame.trimestres.primeiro ? (
                  <Input
                    type="text"
                    placeholder="Resultado"
                    value={(typeof resultados[`${exame.nome}-${subcampo}`] === 'object' && resultados[`${exame.nome}-${subcampo}`] !== null ? (resultados[`${exame.nome}-${subcampo}`] as Record<string, string>)["1"] : "") || ""}
                    onChange={(e) =>
                      handleResultadoChange(`${exame.nome}-${subcampo}`, "1", e.target.value)
                    }
                    className="w-full"
                  />
                ) : (
                  <div className="text-gray-400">-</div>
                )}
              </TableCell>
              <TableCell className="text-center">
                {exame.trimestres.segundo ? (
                  <Input
                    type="text"
                    placeholder="Resultado"
                    value={(typeof resultados[`${exame.nome}-${subcampo}`] === 'object' && resultados[`${exame.nome}-${subcampo}`] !== null ? (resultados[`${exame.nome}-${subcampo}`] as Record<string, string>)["2"] : "") || ""}
                    onChange={(e) =>
                      handleResultadoChange(`${exame.nome}-${subcampo}`, "2", e.target.value)
                    }
                    className="w-full"
                  />
                ) : (
                  <div className="text-gray-400">-</div>
                )}
              </TableCell>
              <TableCell className="text-center">
                {exame.trimestres.terceiro ? (
                  <Input
                    type="text"
                    placeholder="Resultado"
                    value={(typeof resultados[`${exame.nome}-${subcampo}`] === 'object' && resultados[`${exame.nome}-${subcampo}`] !== null ? (resultados[`${exame.nome}-${subcampo}`] as Record<string, string>)["3"] : "") || ""}
                    onChange={(e) =>
                      handleResultadoChange(`${exame.nome}-${subcampo}`, "3", e.target.value)
                    }
                    className="w-full"
                  />
                ) : (
                  <div className="text-gray-400">-</div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </>
      );
    }

    // Renderização normal para exames sem subcampos
    return (
      <TableRow key={exame.nome}>
        <TableCell className="font-medium">{exame.nome}</TableCell>
        <TableCell className="text-center">
          {exame.trimestres.primeiro ? (
            <Input
              type="text"
              placeholder="Resultado"
              value={(typeof resultados[exame.nome] === 'object' && resultados[exame.nome] !== null ? (resultados[exame.nome] as Record<string, string>)["1"] : "") || ""}
              onChange={(e) =>
                handleResultadoChange(exame.nome, "1", e.target.value)
              }
              className="w-full"
            />
          ) : (
            <div className="text-gray-400">-</div>
          )}
        </TableCell>
        <TableCell className="text-center">
          {exame.trimestres.segundo ? (
            <Input
              type="text"
              placeholder="Resultado"
              value={(typeof resultados[exame.nome] === 'object' && resultados[exame.nome] !== null ? (resultados[exame.nome] as Record<string, string>)["2"] : "") || ""}
              onChange={(e) =>
                handleResultadoChange(exame.nome, "2", e.target.value)
              }
              className="w-full"
            />
          ) : (
            <div className="text-gray-400">-</div>
          )}
        </TableCell>
        <TableCell className="text-center">
          {exame.trimestres.terceiro ? (
            <Input
              type="text"
              placeholder="Resultado"
              value={(typeof resultados[exame.nome] === 'object' && resultados[exame.nome] !== null ? (resultados[exame.nome] as Record<string, string>)["3"] : "") || ""}
              onChange={(e) =>
                handleResultadoChange(exame.nome, "3", e.target.value)
              }
              className="w-full"
            />
          ) : (
            <div className="text-gray-400">-</div>
          )}
        </TableCell>
      </TableRow>
    );
  };

  const renderTabelaExames = (titulo: string, exames: ExameConfig[]) => (
    <div>
      <h3 className="text-lg font-semibold mb-4">{titulo}</h3>
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-1/2">Exame</TableHead>
              <TableHead className="text-center w-1/6">1º Trimestre</TableHead>
              <TableHead className="text-center w-1/6">2º Trimestre</TableHead>
              <TableHead className="text-center w-1/6">3º Trimestre</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {exames.map(renderExameRow)}
          </TableBody>
        </Table>
      </div>
    </div>
  );

  return (
    <GestantesLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Exames Laboratoriais</h2>
          <p className="text-muted-foreground">
            Acompanhe os exames realizados em cada trimestre
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Selecionar Gestante</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>Gestante</Label>
              <AutocompleteSelect
                options={
                  gestantes
                    ?.filter((g) => g.dum)
                    .sort((a, b) => a.nome.localeCompare(b.nome))
                    .map((g) => ({
                      id: g.id,
                      nome: g.nome,
                    })) || []
                }
                value={gestanteSelecionada?.toString() || ""}
                onChange={(value) => {
                  setGestanteSelecionada(value ? parseInt(value) : null);
                  setResultados({});
                }}
                placeholder="Digite o nome da gestante..."
              />
            </div>
          </CardContent>
        </Card>

        {gestanteSelecionada && gestante && (
          <Card>
            <CardHeader>
              <CardTitle>Exames de {gestante.nome}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {renderTabelaExames("Exames de Sangue", examesSangue)}
                {renderTabelaExames("Exames de Urina", examesUrina)}
                {renderTabelaExames("Exames de Fezes", examesFezes)}
                {renderTabelaExames("Pesquisa para E.G.B.", outrosExames)}

                {/* Campo de texto livre para outros exames */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">Observações / Outros Exames</h3>
                  <textarea
                    className="w-full min-h-[120px] p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500"
                    placeholder="Digite aqui observações ou outros exames não listados acima..."
                    value={(typeof resultados['outros_observacoes'] === 'string' ? resultados['outros_observacoes'] : '') || ''}
                    onChange={(e) => setResultados({ ...resultados, outros_observacoes: e.target.value })}
                  />
                </div>

                <div className="flex justify-between items-center mt-6">
                  <Button 
                    variant="outline"
                    className="border-purple-600 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950"
                    onClick={() => setModalAberto(true)}
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Interpretar com IA
                  </Button>
                  
                  <Button 
                    className="bg-rose-600 hover:bg-rose-700"
                    onClick={() => {
                      if (gestanteSelecionada) {
                        salvarMutation.mutate({
                          gestanteId: gestanteSelecionada,
                          resultados,
                        });
                      }
                    }}
                    disabled={salvarMutation.isPending}
                  >
                    {salvarMutation.isPending ? 'Salvando...' : 'Salvar Resultados'}
                  </Button>
                </div>
                
                <InterpretarExamesModal
                  open={modalAberto}
                  onOpenChange={setModalAberto}
                  onResultados={(novosResultados, trimestre) => {
                    // Converter resultados da IA para o formato esperado
                    const trimestreNum = trimestre === "primeiro" ? "1" : trimestre === "segundo" ? "2" : "3";
                    const resultadosFormatados: Record<string, Record<string, string> | string> = {};
                    
                    for (const [nomeExame, valor] of Object.entries(novosResultados)) {
                      resultadosFormatados[nomeExame] = {
                        ...(typeof resultados[nomeExame] === 'object' && resultados[nomeExame] !== null ? resultados[nomeExame] : {}),
                        [trimestreNum]: valor,
                      };
                    }
                    
                    setResultados(prev => ({
                      ...prev,
                      ...resultadosFormatados,
                    }));
                  }}
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </GestantesLayout>
  );
}
