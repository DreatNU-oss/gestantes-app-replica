import { useState, useEffect } from "react";
import React from "react";
import GestantesLayout from "@/components/GestantesLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { AutocompleteSelect } from "@/components/AutocompleteSelect";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { InputExameValidado } from "@/components/InputExameValidado";
import { obterIdValidacao } from "@/data/mapeamentoExames";
import { isExameSorologico } from "@/data/valoresReferencia";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { InterpretarExamesModal } from "@/components/InterpretarExamesModal";
import { toast } from "sonner";
import { HistoricoInterpretacoes } from "@/components/HistoricoInterpretacoes";
import { Sparkles, ArrowLeft, Loader2, Check } from "lucide-react";
import { useAutoSave } from "@/hooks/useAutoSave";
import { useLocation } from "wouter";
import { useGestanteAtiva } from "@/contexts/GestanteAtivaContext";
import {
  examesSangue,
  examesUrina,
  examesFezes,
  outrosExames,
  type ExameConfig,
} from "@/data/examesConfig";

export default function ExamesLaboratoriais() {
  const [, setLocation] = useLocation();
  const { gestanteAtiva } = useGestanteAtiva();
  const [gestanteSelecionada, setGestanteSelecionada] = useState<number | null>(gestanteAtiva?.id || null);
  
  // Atualizar gestante selecionada quando gestante ativa mudar
  React.useEffect(() => {
    if (gestanteAtiva) {
      setGestanteSelecionada(gestanteAtiva.id);
    }
  }, [gestanteAtiva]);
  const [resultados, setResultados] = useState<Record<string, Record<string, string> | string>>({});
  
  // Auto-save hook (500ms padrão)
  const { savedAt, clearDraft, loadDraft } = useAutoSave(
    `exames-lab-${gestanteSelecionada || 'sem-gestante'}`,
    resultados
  );
  
  // Formatar timestamp para exibição
  const lastSaved = savedAt ? new Date(savedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : null;
  const [modalAberto, setModalAberto] = useState(false);
  const [trimestreEdicao, setTrimestreEdicao] = useState<number | null>(null);
  const [novaDataTrimestre, setNovaDataTrimestre] = useState<string>("");
  
  // Estados para o modal de copiar data
  const [modalCopiarDataAberto, setModalCopiarDataAberto] = useState(false);
  const [trimestreCopiarData, setTrimestreCopiarData] = useState<1 | 2 | 3>(1);
  const [examesSelecionados, setExamesSelecionados] = useState<string[]>([]);

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
      clearDraft(); // Limpar rascunho após salvar
      toast.success(`✅ Resultados salvos com sucesso!`, {
        description: `${data.count} registro(s) de exames foram salvos para a gestante.`,
        duration: 4000,
      });
    },
    onError: (error) => {
      toast.error('Erro ao salvar resultados', {
        description: error.message,
        duration: 5000,
      });
    },
  });
  
  // Mutation para salvar histórico de interpretações
  const salvarHistoricoMutation = trpc.historicoInterpretacoes.salvar.useMutation();

  // Carregar resultados quando gestante é selecionada
  useEffect(() => {
    console.log('🔍 DEBUG resultadosSalvos:', resultadosSalvos);
    if (resultadosSalvos) {
      setResultados(resultadosSalvos);
    } else if (gestanteSelecionada) {
      // Tentar restaurar rascunho se não houver dados salvos
      const draft = loadDraft();
      if (draft) {
        setResultados(draft);
        toast.info('Rascunho restaurado', {
          description: 'Seus dados foram recuperados automaticamente.',
        });
      }
    }
  }, [resultadosSalvos, gestanteSelecionada]);

  const handleResultadoChange = (exame: string, trimestre: string, valor: string) => {
    setResultados((prev) => ({
      ...prev,
      [exame]: {
        ...(typeof prev[exame] === 'object' && prev[exame] !== null ? prev[exame] : {}),
        [trimestre]: valor,
      },
    }));
  };

  // Função para obter a primeira data preenchida de um trimestre
  const obterPrimeiraDataTrimestre = (numeroTrimestre: 1 | 2 | 3): string | null => {
    const campoData = `data${numeroTrimestre}`;
    console.log('[DEBUG] obterPrimeiraDataTrimestre chamada. Trimestre:', numeroTrimestre, 'Campo:', campoData);
    console.log('[DEBUG] Resultados atuais:', resultados);
    
    // Percorrer todos os exames para encontrar a primeira data preenchida
    for (const exame of [...examesSangue, ...examesUrina, ...examesFezes, ...outrosExames]) {
      const resultadoExame = resultados[exame.nome];
      console.log('[DEBUG] Verificando exame:', exame.nome, 'Resultado:', resultadoExame);
      if (typeof resultadoExame === 'object' && resultadoExame !== null) {
        const data = resultadoExame[campoData];
        console.log('[DEBUG] Data encontrada:', data);
        if (data && data.trim() !== '') {
          console.log('[DEBUG] Retornando data:', data);
          return data;
        }
      }
    }
    console.log('[DEBUG] Nenhuma data encontrada');
    return null;
  };

  // Função para obter lista de exames sem data em um trimestre
  const obterExamesSemData = (numeroTrimestre: 1 | 2 | 3): ExameConfig[] => {
    const campoData = `data${numeroTrimestre}`;
    const examesSemData: ExameConfig[] = [];
    
    for (const exame of [...examesSangue, ...examesUrina, ...examesFezes, ...outrosExames]) {
      // Verificar se o exame tem esse trimestre
      const temTrimestre = numeroTrimestre === 1 ? exame.trimestres.primeiro :
                          numeroTrimestre === 2 ? exame.trimestres.segundo :
                          exame.trimestres.terceiro;
      
      if (!temTrimestre) continue;
      
      const resultadoExame = resultados[exame.nome];
      const temData = typeof resultadoExame === 'object' && 
                     resultadoExame !== null && 
                     resultadoExame[campoData] && 
                     resultadoExame[campoData].trim() !== '';
      
      if (!temData) {
        examesSemData.push(exame);
      }
    }
    
    return examesSemData;
  };
  
  // Função para aplicar data aos exames selecionados
  const aplicarDataAosExames = () => {
    const primeiraData = obterPrimeiraDataTrimestre(trimestreCopiarData);
    
    if (!primeiraData) {
      toast.error('Nenhuma data encontrada para copiar');
      return;
    }
    
    if (examesSelecionados.length === 0) {
      toast.error('Selecione pelo menos um exame');
      return;
    }
    
    // Aplicar data a todos os exames selecionados
    examesSelecionados.forEach(nomeExame => {
      handleResultadoChange(nomeExame, `data${trimestreCopiarData}`, primeiraData);
    });
    
    toast.success(`Data copiada para ${examesSelecionados.length} exame(s)!`);
    
    // Fechar modal e limpar seleção
    setModalCopiarDataAberto(false);
    setExamesSelecionados([]);
  };
  
  // Função para abrir modal de copiar data
  const abrirModalCopiarData = (trimestre: 1 | 2 | 3) => {
    console.log('[DEBUG] abrirModalCopiarData chamada. Trimestre:', trimestre);
    const primeiraData = obterPrimeiraDataTrimestre(trimestre);
    console.log('[DEBUG] primeiraData:', primeiraData);
    
    if (!primeiraData) {
      toast.error('Preencha pelo menos uma data neste trimestre antes de copiar');
      return;
    }
    
    const examesSemData = obterExamesSemData(trimestre);
    
    if (examesSemData.length === 0) {
      toast.info('Todos os exames deste trimestre já têm data preenchida');
      return;
    }
    
    setTrimestreCopiarData(trimestre);
    setModalCopiarDataAberto(true);
  };

  // Componente helper para renderizar campo de resultado (Select ou Input)
  const renderCampoResultado = (nomeExame: string, trimestre: 1 | 2 | 3, valor: string, subcampo?: string) => {
    // Todos os exames agora usam input de texto livre para permitir valores numéricos e anotações
    const chave = subcampo ? `${subcampo}_${trimestre}` : trimestre.toString();
    
    return (
      <InputExameValidado
        nomeExame={obterIdValidacao(nomeExame) || nomeExame}
        trimestre={trimestre}
        value={valor}
        onChange={(novoValor) => handleResultadoChange(nomeExame, chave, novoValor)}
        className="w-full"
      />
    );
  };

  const renderExameRow = (exame: ExameConfig) => {
    // Se o exame tem subcampos (ex: TTGO), renderizar múltiplas linhas
    if (exame.subcampos) {
      return (
        <React.Fragment key={exame.nome}>
          {exame.subcampos.map((subcampo, index) => (
            <TableRow key={`${exame.nome}-${subcampo}`}>
              <TableCell className="font-medium">
                {index === 0 ? exame.nome : ""}
                <span className="text-sm text-gray-500 ml-2">{subcampo}</span>
              </TableCell>
              {/* 1º Trimestre - Data */}
              <TableCell className="text-center">
                {exame.trimestres.primeiro ? (
                  <div className="flex flex-col gap-1">
                    <Input
                      type="date"
                      value={(typeof resultados[exame.nome] === 'object' && resultados[exame.nome] !== null ? (resultados[exame.nome] as Record<string, string>)["data1"] : "") || ""}
                      onChange={(e) =>
                        handleResultadoChange(exame.nome, "data1", e.target.value)
                      }
                      className="w-full text-xs"
                      placeholder="Data"
                    />

                  </div>
                ) : (
                  <div className="text-gray-400">-</div>
                )}
              </TableCell>
              {/* 1º Trimestre - Resultado */}
              <TableCell className="text-center">
                {exame.trimestres.primeiro ? (
                  renderCampoResultado(
                    exame.nome,
                    1,
                    (typeof resultados[exame.nome] === 'object' && resultados[exame.nome] !== null ? (resultados[exame.nome] as Record<string, string>)[`${subcampo}_1`] : "") || "",
                    subcampo
                  )
                ) : (
                  <div className="text-gray-400">-</div>
                )}
              </TableCell>
              {/* 2º Trimestre - Data */}
              <TableCell className="text-center">
                {exame.trimestres.segundo ? (
                  <div className="flex flex-col gap-1">
                    <Input
                      type="date"
                      value={(typeof resultados[exame.nome] === 'object' && resultados[exame.nome] !== null ? (resultados[exame.nome] as Record<string, string>)["data2"] : "") || ""}
                      onChange={(e) =>
                        handleResultadoChange(exame.nome, "data2", e.target.value)
                      }
                      className="w-full text-xs"
                      placeholder="Data"
                    />

                  </div>
                ) : (
                  <div className="text-gray-400">-</div>
                )}
              </TableCell>
              {/* 2º Trimestre - Resultado */}
              <TableCell className="text-center">
                {exame.trimestres.segundo ? (
                  renderCampoResultado(
                    exame.nome,
                    2,
                    (typeof resultados[exame.nome] === 'object' && resultados[exame.nome] !== null ? (resultados[exame.nome] as Record<string, string>)[`${subcampo}_2`] : "") || "",
                    subcampo
                  )
                ) : (
                  <div className="text-gray-400">-</div>
                )}
              </TableCell>
              {/* 3º Trimestre - Data */}
              <TableCell className="text-center">
                {exame.trimestres.terceiro ? (
                  <div className="flex flex-col gap-1">
                    <Input
                      type="date"
                      value={(typeof resultados[exame.nome] === 'object' && resultados[exame.nome] !== null ? (resultados[exame.nome] as Record<string, string>)["data3"] : "") || ""}
                      onChange={(e) =>
                        handleResultadoChange(exame.nome, "data3", e.target.value)
                      }
                      className="w-full text-xs"
                      placeholder="Data"
                    />

                  </div>
                ) : (
                  <div className="text-gray-400">-</div>
                )}
              </TableCell>
              {/* 3º Trimestre - Resultado */}
              <TableCell className="text-center">
                {exame.trimestres.terceiro ? (
                  renderCampoResultado(
                    exame.nome,
                    3,
                    (typeof resultados[exame.nome] === 'object' && resultados[exame.nome] !== null ? (resultados[exame.nome] as Record<string, string>)[`${subcampo}_3`] : "") || "",
                    subcampo
                  )
                ) : (
                  <div className="text-gray-400">-</div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </React.Fragment>
      );
    }

    // Renderização normal para exames sem subcampos
    return (
      <TableRow key={exame.nome}>
        <TableCell className="font-medium">{exame.nome}</TableCell>
        {/* 1º Trimestre - Data */}
        <TableCell className="text-center">
          {exame.trimestres.primeiro ? (
            <div className="flex flex-col gap-1">
              <Input
                type="date"
                value={(typeof resultados[exame.nome] === 'object' && resultados[exame.nome] !== null ? (resultados[exame.nome] as Record<string, string>)["data1"] : "") || ""}
                onChange={(e) =>
                  handleResultadoChange(exame.nome, "data1", e.target.value)
                }
                className="w-full text-xs"
                placeholder="Data"
              />
            </div>
          ) : (
            <div className="text-gray-400">-</div>
          )}
        </TableCell>
        {/* 1º Trimestre - Resultado */}
        <TableCell className="text-center">
          {exame.trimestres.primeiro ? (
            renderCampoResultado(
              exame.nome,
              1,
              (typeof resultados[exame.nome] === 'object' && resultados[exame.nome] !== null ? (resultados[exame.nome] as Record<string, string>)["1"] : "") || ""
            )
          ) : (
            <div className="text-gray-400">-</div>
          )}
        </TableCell>
        {/* 2º Trimestre - Data */}
        <TableCell className="text-center">
          {exame.trimestres.segundo ? (
            <div className="flex flex-col gap-1">
              <Input
                type="date"
                value={(typeof resultados[exame.nome] === 'object' && resultados[exame.nome] !== null ? (resultados[exame.nome] as Record<string, string>)["data2"] : "") || ""}
                onChange={(e) =>
                  handleResultadoChange(exame.nome, "data2", e.target.value)
                }
                className="w-full text-xs"
                placeholder="Data"
              />
            </div>
          ) : (
            <div className="text-gray-400">-</div>
          )}
        </TableCell>
        {/* 2º Trimestre - Resultado */}
        <TableCell className="text-center">
          {exame.trimestres.segundo ? (
            renderCampoResultado(
              exame.nome,
              2,
              (typeof resultados[exame.nome] === 'object' && resultados[exame.nome] !== null ? (resultados[exame.nome] as Record<string, string>)["2"] : "") || ""
            )
          ) : (
            <div className="text-gray-400">-</div>
          )}
        </TableCell>
        {/* 3º Trimestre - Data */}
        <TableCell className="text-center">
          {exame.trimestres.terceiro ? (
            <div className="flex flex-col gap-1">
              <Input
                type="date"
                value={(typeof resultados[exame.nome] === 'object' && resultados[exame.nome] !== null ? (resultados[exame.nome] as Record<string, string>)["data3"] : "") || ""}
                onChange={(e) =>
                  handleResultadoChange(exame.nome, "data3", e.target.value)
                }
                className="w-full text-xs"
                placeholder="Data"
              />
            </div>
          ) : (
            <div className="text-gray-400">-</div>
          )}
        </TableCell>
        {/* 3º Trimestre - Resultado */}
        <TableCell className="text-center">
          {exame.trimestres.terceiro ? (
            renderCampoResultado(
              exame.nome,
              3,
              (typeof resultados[exame.nome] === 'object' && resultados[exame.nome] !== null ? (resultados[exame.nome] as Record<string, string>)["3"] : "") || ""
            )
          ) : (
            <div className="text-gray-400">-</div>
          )}
        </TableCell>
      </TableRow>
    );
  };

  const renderTabelaExames = (titulo: string, exames: ExameConfig[]) => (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{titulo}</h3>
      </div>
      
      {/* Botões de Copiar Data - Acima da Tabela */}
      <div className="flex gap-4 mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Copiar data para múltiplos exames:</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="bg-white hover:bg-blue-100"
          onClick={() => abrirModalCopiarData(1)}
        >
          1º Trimestre
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="bg-white hover:bg-blue-100"
          onClick={() => abrirModalCopiarData(2)}
        >
          2º Trimestre
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="bg-white hover:bg-blue-100"
          onClick={() => abrirModalCopiarData(3)}
        >
          3º Trimestre
        </Button>
      </div>
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-1/6">Exame</TableHead>
              <TableHead className="text-center w-1/12">
                <div className="flex flex-col items-center gap-1">
                  <span>Data 1º Tri</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => setTrimestreEdicao(1)}
                  >
                    Alterar
                  </Button>
                </div>
              </TableHead>
              <TableHead className="text-center w-1/6">Resultado 1º Tri</TableHead>
              <TableHead className="text-center w-1/12">
                <div className="flex flex-col items-center gap-1">
                  <span>Data 2º Tri</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => setTrimestreEdicao(2)}
                  >
                    Alterar
                  </Button>
                </div>
              </TableHead>
              <TableHead className="text-center w-1/6">Resultado 2º Tri</TableHead>
              <TableHead className="text-center w-1/12">
                <div className="flex flex-col items-center gap-1">
                  <span>Data 3º Tri</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => setTrimestreEdicao(3)}
                  >
                    Alterar
                  </Button>
                </div>
              </TableHead>
              <TableHead className="text-center w-1/6">Resultado 3º Tri</TableHead>
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
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/")}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h2 className="text-3xl font-bold text-foreground">Exames Laboratoriais</h2>
            <p className="text-muted-foreground">
              Acompanhe os exames realizados em cada trimestre
            </p>
          </div>
          {lastSaved && gestanteSelecionada && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Check className="h-4 w-4 text-green-600" />
              <span>Rascunho salvo {lastSaved}</span>
            </div>
          )}
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
              {/* Histórico de Interpretações */}
              <HistoricoInterpretacoes gestanteId={gestanteSelecionada!} tipo="exames_laboratoriais" />
              
              <div className="space-y-8 mt-6">
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
                        // Extrair datas dos resultados (data1, data2, data3)
                        const datas: Record<string, Record<string, string> | string> = {};
                        const resultadosLimpos: Record<string, Record<string, string> | string> = {};
                        
                        for (const [nomeExame, valor] of Object.entries(resultados)) {
                          if (typeof valor === 'object' && valor !== null) {
                            const { data1, data2, data3, ...resto } = valor as Record<string, string>;
                            
                            // Armazenar datas se existirem
                            if (data1 || data2 || data3) {
                              datas[nomeExame] = {};
                              if (data1) (datas[nomeExame] as Record<string, string>).data1 = data1;
                              if (data2) (datas[nomeExame] as Record<string, string>).data2 = data2;
                              if (data3) (datas[nomeExame] as Record<string, string>).data3 = data3;
                            }
                            
                            // Remover campos de data dos resultados
                            resultadosLimpos[nomeExame] = resto;
                          } else {
                            resultadosLimpos[nomeExame] = valor;
                          }
                        }
                        
                        salvarMutation.mutate({
                          gestanteId: gestanteSelecionada,
                          resultados: resultadosLimpos,
                          datas: Object.keys(datas).length > 0 ? datas : undefined,
                        });
                      }
                    }}
                    disabled={salvarMutation.isPending}
                  >
                    {salvarMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {salvarMutation.isPending ? 'Salvando...' : 'Salvar Resultados'}
                  </Button>
                </div>
                
                <InterpretarExamesModal
                  open={modalAberto}
                  onOpenChange={setModalAberto}
                  dumGestante={gestante?.dum ? new Date(gestante.dum) : null}
                  onResultados={(novosResultados, trimestre, dataColeta, arquivosProcessados) => {
                    console.log('[DEBUG FRONTEND] onResultados chamado');
                    console.log('[DEBUG FRONTEND] novosResultados:', novosResultados);
                    console.log('[DEBUG FRONTEND] trimestre:', trimestre);
                    console.log('[DEBUG FRONTEND] dataColeta:', dataColeta);
                    
                    // Converter resultados da IA para o formato esperado
                    const trimestreNum = trimestre === "primeiro" ? "1" : trimestre === "segundo" ? "2" : "3";
                    const resultadosFormatados: Record<string, Record<string, string> | string> = {};
                    
                    for (const [chave, valor] of Object.entries(novosResultados)) {
                      console.log(`[DEBUG FRONTEND] Processando: ${chave} = ${valor}`);
                      
                      // Detectar se é um exame com subcampo (formato: "NomeExame__Subcampo")
                      if (chave.includes('__')) {
                        console.log(`[DEBUG FRONTEND] Detectado subcampo em: ${chave}`);
                        const [nomeExame, subcampo] = chave.split('__');
                        
                        // Inicializar objeto do exame se não existir
                        if (!resultadosFormatados[nomeExame]) {
                          resultadosFormatados[nomeExame] = {
                            ...(typeof resultados[nomeExame] === 'object' && resultados[nomeExame] !== null ? resultados[nomeExame] : {}),
                          };
                        }
                        
                        // Adicionar subcampo ao trimestre correspondente
                        const subcampoKey = `${subcampo}_${trimestreNum}`;
                        console.log(`[DEBUG FRONTEND] subcampoKey: ${subcampoKey}`);
                        (resultadosFormatados[nomeExame] as Record<string, string>)[subcampoKey] = valor;
                        
                        // Adicionar data para o trimestre (uma vez por exame)
                        if (dataColeta && !(resultadosFormatados[nomeExame] as Record<string, string>)[`data${trimestreNum}`]) {
                          (resultadosFormatados[nomeExame] as Record<string, string>)[`data${trimestreNum}`] = dataColeta;
                        }
                      } else {
                        // Exame simples (sem subcampos)
                        resultadosFormatados[chave] = {
                          ...(typeof resultados[chave] === 'object' && resultados[chave] !== null ? resultados[chave] : {}),
                          [trimestreNum]: valor,
                          ...(dataColeta ? { [`data${trimestreNum}`]: dataColeta } : {}),
                        };
                      }
                    }
                    
                    console.log('[DEBUG FRONTEND] resultadosFormatados:', resultadosFormatados);
                    
                    setResultados(prev => {
                      const novoEstado = {
                        ...prev,
                        ...resultadosFormatados,
                      };
                      console.log('[DEBUG FRONTEND] Novo estado de resultados:', novoEstado);
                      return novoEstado;
                    });
                    
                    // Salvar no histórico de interpretações
                    if (gestanteSelecionada) {
                      salvarHistoricoMutation.mutate({
                        gestanteId: gestanteSelecionada,
                        tipoInterpretacao: 'exames_laboratoriais',
                        tipoExame: trimestre,
                        arquivosProcessados: arquivosProcessados || 1,
                        resultadoJson: novosResultados,
                      });
                    }
                  }}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Modal de Edição Rápida de Data */}
        <Dialog open={trimestreEdicao !== null} onOpenChange={(open) => !open && setTrimestreEdicao(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Alterar Data do {trimestreEdicao}º Trimestre</DialogTitle>
              <DialogDescription>
                Esta ação irá atualizar a data de todos os exames do {trimestreEdicao}º trimestre.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nova-data">Nova Data</Label>
                <input
                  id="nova-data"
                  type="date"
                  value={novaDataTrimestre}
                  onChange={(e) => setNovaDataTrimestre(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setTrimestreEdicao(null)}>
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  if (!novaDataTrimestre) {
                    alert('Por favor, informe uma data');
                    return;
                  }
                  
                  // Atualizar data de todos os exames do trimestre
                  setResultados(prev => {
                    const novosResultados = { ...prev };
                    
                    for (const [chave, valor] of Object.entries(novosResultados)) {
                      if (typeof valor === 'object' && valor !== null) {
                        novosResultados[chave] = {
                          ...valor,
                          [`data${trimestreEdicao}`]: novaDataTrimestre,
                        };
                      }
                    }
                    
                    return novosResultados;
                  });
                  
                  alert(`Data do ${trimestreEdicao}º trimestre atualizada para ${novaDataTrimestre}`);
                  setTrimestreEdicao(null);
                  setNovaDataTrimestre("");
                }}
              >
                Atualizar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Modal de Copiar Data para Múltiplos Exames */}
        <Dialog open={modalCopiarDataAberto} onOpenChange={setModalCopiarDataAberto}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Copiar Data para Múltiplos Exames</DialogTitle>
              <DialogDescription>
                Data a ser copiada: <strong>{obterPrimeiraDataTrimestre(trimestreCopiarData)}</strong>
                <br />
                Selecione os exames que deseja preencher com esta data:
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-3 py-4">
              {obterExamesSemData(trimestreCopiarData).map((exame) => (
                <div key={exame.nome} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
                  <Checkbox
                    id={`exame-${exame.nome}`}
                    checked={examesSelecionados.includes(exame.nome)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setExamesSelecionados([...examesSelecionados, exame.nome]);
                      } else {
                        setExamesSelecionados(examesSelecionados.filter(e => e !== exame.nome));
                      }
                    }}
                  />
                  <label
                    htmlFor={`exame-${exame.nome}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                  >
                    {exame.nome}
                  </label>
                </div>
              ))}
            </div>
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setModalCopiarDataAberto(false);
                  setExamesSelecionados([]);
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={aplicarDataAosExames}
                disabled={examesSelecionados.length === 0}
              >
                Aplicar ({examesSelecionados.length} selecionado{examesSelecionados.length !== 1 ? 's' : ''})
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </GestantesLayout>
  );
}
