import { useState } from "react";
import GestantesLayout from "@/components/GestantesLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { AutocompleteSelect } from "@/components/AutocompleteSelect";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  examesSangue,
  examesUrina,
  examesFezes,
  outrosExames,
  type ExameConfig,
} from "@/data/examesConfig";

export default function ExamesLaboratoriais() {
  const [gestanteSelecionada, setGestanteSelecionada] = useState<number | null>(null);
  const [resultados, setResultados] = useState<Record<string, Record<string, string>>>({});

  const { data: gestantes, isLoading: loadingGestantes } = trpc.gestantes.list.useQuery();

  const gestante = gestantes?.find((g) => g.id === gestanteSelecionada);

  const handleResultadoChange = (exame: string, trimestre: string, valor: string) => {
    setResultados((prev) => ({
      ...prev,
      [exame]: {
        ...prev[exame],
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
                    value={resultados[`${exame.nome}-${subcampo}`]?.["1"] || ""}
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
                    value={resultados[`${exame.nome}-${subcampo}`]?.["2"] || ""}
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
                    value={resultados[`${exame.nome}-${subcampo}`]?.["3"] || ""}
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
              value={resultados[exame.nome]?.["1"] || ""}
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
              value={resultados[exame.nome]?.["2"] || ""}
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
              value={resultados[exame.nome]?.["3"] || ""}
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
                {renderTabelaExames("Outros Exames", outrosExames)}

                <div className="flex justify-end mt-6">
                  <Button className="bg-rose-600 hover:bg-rose-700">
                    Salvar Resultados
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </GestantesLayout>
  );
}
