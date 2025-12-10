import { useState } from "react";
import GestantesLayout from "@/components/GestantesLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { AutocompleteSelect } from "@/components/AutocompleteSelect";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";

// Lista de exames organizados por categoria
const EXAMES_SANGUE = [
  "Hemograma completo",
  "Tipagem sanguínea ABO/Rh",
  "Coombs indireto",
  "Glicemia de jejum",
  "TTGO 75g",
  "VDRL",
  "HIV",
  "Hepatite B – HBsAg",
  "Hepatite C – Anti-HCV",
  "Toxoplasmose IgG/IgM",
  "Rubéola IgG/IgM",
  "Citomegalovírus IgG/IgM",
  "FTA-ABS IgG + IgM",
  "TSH",
  "T4 Livre",
  "Eletroforese de Hemoglobina",
  "Ferritina",
  "Vitamina D (25-OH)",
  "Vitamina B12",
];

const EXAMES_URINA = [
  "EAS (Urina tipo 1)",
  "Urocultura",
];

const EXAMES_FEZES = [
  "EPF",
];

const EXAMES_OUTROS = [
  "Swab vaginal/retal (EGB)",
];

export default function ExamesLaboratoriais() {
  const [gestanteSelecionada, setGestanteSelecionada] = useState<number | null>(null);

  const { data: gestantes, isLoading: loadingGestantes } = trpc.gestantes.list.useQuery();

  const gestante = gestantes?.find((g) => g.id === gestanteSelecionada);

  const renderExameRow = (nomeExame: string) => (
    <TableRow key={nomeExame}>
      <TableCell className="font-medium">{nomeExame}</TableCell>
      <TableCell className="text-center">
        <Checkbox />
      </TableCell>
      <TableCell className="text-center">
        <Checkbox />
      </TableCell>
      <TableCell className="text-center">
        <Checkbox />
      </TableCell>
    </TableRow>
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
                onChange={(value) => setGestanteSelecionada(value ? parseInt(value) : null)}
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
                {/* Exames de Sangue */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Exames de Sangue</h3>
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
                        {EXAMES_SANGUE.map(renderExameRow)}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Exames de Urina */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Exames de Urina</h3>
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
                        {EXAMES_URINA.map(renderExameRow)}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Exames de Fezes */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Exames de Fezes</h3>
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
                        {EXAMES_FEZES.map(renderExameRow)}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Outros Exames */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Outros Exames</h3>
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
                        {EXAMES_OUTROS.map(renderExameRow)}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </GestantesLayout>
  );
}
