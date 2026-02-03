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
import { ArquivosExamesSection } from "@/components/ArquivosExamesSection";
import { toast } from "sonner";
import { HistoricoInterpretacoes } from "@/components/HistoricoInterpretacoes";
import { HistoricoExamePopover } from "@/components/HistoricoExamePopover";
import { Sparkles, ArrowLeft, Loader2, Check, Calendar, History } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Função auxiliar para navegação inteligente por TAB
const navegarParaProximoResultado = (trimestreAtual: number) => {
  // Buscar todos os campos de resultado do mesmo trimestre
  const camposResultado = Array.from(
    document.querySelectorAll<HTMLInputElement | HTMLButtonElement>(
      `[data-field-type="resultado"][data-trimestre="${trimestreAtual}"]`
    )
  );
  
  // Encontrar o elemento atualmente focado
  const elementoAtual = document.activeElement;
  const indiceAtual = camposResultado.indexOf(elementoAtual as HTMLInputElement | HTMLButtonElement);
  
  // Se encontrou o elemento atual e há um próximo
  if (indiceAtual !== -1 && indiceAtual < camposResultado.length - 1) {
    const proximoCampo = camposResultado[indiceAtual + 1];
    proximoCampo.focus();
    return true;
  }
  
  return false;
};

// Lista de exames sorológicos que devem ter dropdown Reagente/Não Reagente
const EXAMES_SOROLOGICOS = [
  "FTA-ABS IgG",
  "FTA-ABS IgM",
  "Toxoplasmose IgG",
  "Toxoplasmose IgM",
  "Rubéola IgG",
  "Rubéola IgM",
  "Citomegalovírus IgG",
  "Citomegalovírus IgM",
  "HIV",
  "Hepatite C (Anti-HCV)",
  "Hepatite B (HBsAg)",
  "Anti-HBs",
  "Coombs indireto", // Não Reagente = normal (verde), Reagente = crítico (vermelho)
];

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
  

  
  // Estados para o modal de exclusão de trimestre
  const [modalExcluirTrimestreAberto, setModalExcluirTrimestreAberto] = useState(false);
  const [trimestreParaExcluir, setTrimestreParaExcluir] = useState<1 | 2 | 3 | null>(null);
  
  // Estados para o modal de preenchimento em lote
  const [modalPreenchimentoLoteAberto, setModalPreenchimentoLoteAberto] = useState(false);
  const [trimestrePreenchimentoLote, setTrimestrePreenchimentoLote] = useState<1 | 2 | 3>(1);
  // Mapa de exame -> valor selecionado ("normal" ou "alterado")
  const [selecaoExamesLote, setSelecaoExamesLote] = useState<Record<string, "normal" | "alterado">>({});
  // Set de exames selecionados para incluir no lote
  const [examesSelecionadosLote, setExamesSelecionadosLote] = useState<Set<string>>(new Set());
  // Data para o preenchimento em lote
  const [dataPreenchimentoLote, setDataPreenchimentoLote] = useState<string>('');

  const { data: gestantes, isLoading: loadingGestantes } = trpc.gestantes.list.useQuery();

  const gestante = gestantes?.find((g) => g.id === gestanteSelecionada);

  // Debug: verificar dados da gestante
  React.useEffect(() => {
    if (gestante) {
      console.log('[DEBUG ExamesLaboratoriais] Gestante carregada:', gestante.nome);
      console.log('[DEBUG ExamesLaboratoriais] DUM:', gestante.dum);
      console.log('[DEBUG ExamesLaboratoriais] calculado:', gestante.calculado);
      console.log('[DEBUG ExamesLaboratoriais] dppUS:', gestante.calculado?.dppUS);
    }
  }, [gestante]);

  // Query para buscar resultados salvos com histórico
  const { data: dadosExames, isLoading: loadingResultados } = trpc.examesLab.buscarComHistorico.useQuery(
    { gestanteId: gestanteSelecionada! },
    { enabled: !!gestanteSelecionada }
  );
  
  // Extrair exames e histórico
  const resultadosSalvos = dadosExames?.exames;
  const historicoExames = dadosExames?.historico || {};

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
  
  // Utils para invalidar queries
  const utils = trpc.useUtils();
  
  // Mutation para excluir resultado do histórico
  const excluirResultadoMutation = trpc.examesLab.excluirResultado.useMutation({
    onSuccess: () => {
      toast.success('Registro excluído do histórico');
      utils.examesLab.buscarComHistorico.invalidate({ gestanteId: gestanteSelecionada! });
    },
    onError: (error) => {
      toast.error('Erro ao excluir registro: ' + error.message);
    },
  });

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

  // Implementar navegação por teclado e atalhos
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S para salvar
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        if (gestanteSelecionada && Object.keys(resultados).length > 0) {
          handleSalvar();
        }
        return;
      }

      // Enter para avançar para próximo campo (apenas em inputs e selects)
      if (e.key === 'Enter') {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.hasAttribute('role')) {
          e.preventDefault();
          const focusableElements = Array.from(
            document.querySelectorAll(
              'input:not([disabled]), select:not([disabled]), button[role="combobox"]:not([disabled]), textarea:not([disabled])'
            )
          ) as HTMLElement[];
          
          const currentIndex = focusableElements.indexOf(target);
          if (currentIndex !== -1 && currentIndex < focusableElements.length - 1) {
            // Encontrar próximo elemento visível
            for (let i = currentIndex + 1; i < focusableElements.length; i++) {
              const nextElement = focusableElements[i];
              if (nextElement.offsetParent !== null) { // Verifica se está visível
                nextElement.focus();
                break;
              }
            }
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [gestanteSelecionada, resultados]);

  // Auto-foco no primeiro campo quando gestante é selecionada
  useEffect(() => {
    if (gestanteSelecionada) {
      // Aguardar renderização da tabela
      setTimeout(() => {
        const firstInput = document.querySelector(
          'input[type="date"]:not([disabled])'
        ) as HTMLInputElement;
        if (firstInput) {
          firstInput.focus();
        }
      }, 300);
    }
  }, [gestanteSelecionada]);

  const handleResultadoChange = (exame: string, trimestre: string, valor: string) => {
    setResultados((prev) => ({
      ...prev,
      [exame]: {
        ...(typeof prev[exame] === 'object' && prev[exame] !== null ? prev[exame] : {}),
        [trimestre]: valor,
      },
    }));
  };

  // Função para salvar resultados (usada pelo botão e pelo atalho Ctrl+S)
  const handleSalvar = () => {
    if (!gestanteSelecionada) return;
    
    const resultadosLimpos: Record<string, any> = {};
    const datas: Record<string, { data1?: string; data2?: string; data3?: string }> = {};

    for (const [nomeExame, valor] of Object.entries(resultados)) {
      if (typeof valor === 'object' && valor !== null) {
        const { data1, data2, data3, ...resto } = valor;
        
        // Salvar datas separadamente - apenas se tiverem valor válido (não undefined/null/vazio)
        const datasValidas: { data1?: string; data2?: string; data3?: string } = {};
        if (data1 && typeof data1 === 'string' && data1.trim()) datasValidas.data1 = data1;
        if (data2 && typeof data2 === 'string' && data2.trim()) datasValidas.data2 = data2;
        if (data3 && typeof data3 === 'string' && data3.trim()) datasValidas.data3 = data3;
        
        if (Object.keys(datasValidas).length > 0) {
          datas[nomeExame] = datasValidas;
        }
        
        // Remover campos de data e valores undefined/null dos resultados
        const restoLimpo: Record<string, string> = {};
        for (const [key, val] of Object.entries(resto)) {
          if (val !== undefined && val !== null && typeof val === 'string') {
            restoLimpo[key] = val;
          }
        }
        
        if (Object.keys(restoLimpo).length > 0) {
          resultadosLimpos[nomeExame] = restoLimpo;
        }
      } else if (valor !== undefined && valor !== null) {
        resultadosLimpos[nomeExame] = valor;
      }
    }
    
    salvarMutation.mutate({
      gestanteId: gestanteSelecionada,
      resultados: resultadosLimpos,
      datas: Object.keys(datas).length > 0 ? datas : undefined,
      modoAdicionar: true, // Preservar histórico de exames anteriores
    });
  };

  // Função para obter lista de exames qualitativos de um trimestre
  const obterExamesQualitativos = (trimestre: 1 | 2 | 3): { nome: string; tipo: string; valorNormal: string; valorAlterado: string }[] => {
    const todosExames = [...examesSangue, ...examesUrina, ...examesFezes, ...outrosExames];
    const examesQualitativos: { nome: string; tipo: string; valorNormal: string; valorAlterado: string }[] = [];
    
    for (const exame of todosExames) {
      const temTrimestre = trimestre === 1 ? exame.trimestres.primeiro :
                          trimestre === 2 ? exame.trimestres.segundo :
                          exame.trimestres.terceiro;
      
      if (!temTrimestre) continue;
      
      // Exames sorológicos
      if (EXAMES_SOROLOGICOS.includes(exame.nome)) {
        examesQualitativos.push({
          nome: exame.nome,
          tipo: "sorologico",
          valorNormal: "Não Reagente",
          valorAlterado: "Reagente"
        });
      }
      // EAS
      else if (exame.nome === "EAS (Urina tipo 1)") {
        examesQualitativos.push({
          nome: exame.nome,
          tipo: "eas",
          valorNormal: "Normal",
          valorAlterado: "Alterado"
        });
      }
      // Urocultura
      else if (exame.nome === "Urocultura") {
        examesQualitativos.push({
          nome: exame.nome,
          tipo: "urocultura",
          valorNormal: "Negativa",
          valorAlterado: "Positiva"
        });
      }
      // EPF
      else if (exame.nome === "EPF (Parasitológico de Fezes)") {
        examesQualitativos.push({
          nome: exame.nome,
          tipo: "epf",
          valorNormal: "Negativo",
          valorAlterado: "Positivo"
        });
      }
    }
    
    return examesQualitativos;
  };

  // Função para abrir modal de preenchimento em lote
  const abrirModalPreenchimentoLote = (trimestre: 1 | 2 | 3) => {
    if (!gestanteSelecionada) {
      toast.error('Selecione uma gestante primeiro');
      return;
    }
    
    // Inicializar seleção com todos como "normal" e todos selecionados
    const examesQualitativos = obterExamesQualitativos(trimestre);
    const selecaoInicial: Record<string, "normal" | "alterado"> = {};
    const examesSelecionadosInicial = new Set<string>();
    
    for (const exame of examesQualitativos) {
      selecaoInicial[exame.nome] = "normal";
      examesSelecionadosInicial.add(exame.nome);
    }
    
    setSelecaoExamesLote(selecaoInicial);
    setExamesSelecionadosLote(examesSelecionadosInicial);
    setTrimestrePreenchimentoLote(trimestre);
    // Inicializar data com a data atual no formato YYYY-MM-DD
    setDataPreenchimentoLote(new Date().toISOString().split('T')[0]);
    setModalPreenchimentoLoteAberto(true);
  };

  // Função para aplicar preenchimento em lote
  const aplicarPreenchimentoLote = () => {
    const novosResultados = { ...resultados };
    let contadorPreenchidos = 0;
    const examesQualitativos = obterExamesQualitativos(trimestrePreenchimentoLote);
    const chave = trimestrePreenchimentoLote.toString();
    const chaveData = `data${trimestrePreenchimentoLote}`;
    
    for (const exame of examesQualitativos) {
      // Só preencher exames que estão selecionados (checkbox marcado)
      if (!examesSelecionadosLote.has(exame.nome)) continue;
      
      const selecao = selecaoExamesLote[exame.nome];
      if (!selecao) continue;
      
      const valor = selecao === "normal" ? exame.valorNormal : exame.valorAlterado;
      
      // Inicializar objeto se não existir
      if (!novosResultados[exame.nome] || typeof novosResultados[exame.nome] !== 'object') {
        novosResultados[exame.nome] = {};
      }
      
      (novosResultados[exame.nome] as Record<string, string>)[chave] = valor;
      
      // Adicionar a data se foi informada
      if (dataPreenchimentoLote) {
        (novosResultados[exame.nome] as Record<string, string>)[chaveData] = dataPreenchimentoLote;
      }
      
      contadorPreenchidos++;
    }
    
    setResultados(novosResultados);
    setModalPreenchimentoLoteAberto(false);
    
    if (contadorPreenchidos > 0) {
      const dataFormatada = dataPreenchimentoLote 
        ? new Date(dataPreenchimentoLote + 'T12:00:00').toLocaleDateString('pt-BR')
        : '';
      const msgData = dataFormatada ? ` com data ${dataFormatada}` : '';
      toast.success(`${contadorPreenchidos} exames preenchidos no ${trimestrePreenchimentoLote}º trimestre${msgData}`);
    } else {
      toast.info('Nenhum exame selecionado para preencher');
    }
  };

  // Função para marcar todos como normal ou alterado no modal
  const marcarTodosNoModal = (tipo: "normal" | "alterado") => {
    const examesQualitativos = obterExamesQualitativos(trimestrePreenchimentoLote);
    const novaSelecao: Record<string, "normal" | "alterado"> = {};
    
    for (const exame of examesQualitativos) {
      novaSelecao[exame.nome] = tipo;
    }
    
    setSelecaoExamesLote(novaSelecao);
  };
  
  // Função para selecionar/desselecionar todos os exames no modal
  const toggleSelecionarTodosExames = () => {
    const examesQualitativos = obterExamesQualitativos(trimestrePreenchimentoLote);
    const todosNomes = examesQualitativos.map(e => e.nome);
    
    if (examesSelecionadosLote.size === todosNomes.length) {
      // Se todos estão selecionados, desselecionar todos
      setExamesSelecionadosLote(new Set());
    } else {
      // Senão, selecionar todos
      setExamesSelecionadosLote(new Set(todosNomes));
    }
  };
  
  // Função para toggle de um exame específico
  const toggleExameSelecionado = (nomeExame: string) => {
    setExamesSelecionadosLote(prev => {
      const novoSet = new Set(prev);
      if (novoSet.has(nomeExame)) {
        novoSet.delete(nomeExame);
      } else {
        novoSet.add(nomeExame);
      }
      return novoSet;
    });
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

  // Componente helper para renderizar campo de resultado (Select ou Input) com histórico
  const renderCampoResultado = (nomeExame: string, trimestre: 1 | 2 | 3, valor: string, subcampo?: string) => {
    const chave = subcampo ? `${subcampo}_${trimestre}` : trimestre.toString();
    
    // Obter histórico do exame para este trimestre
    const chaveHistorico = `${nomeExame}::${trimestre}`;
    const historicoDoExame = historicoExames[chaveHistorico] || [];
    
    // Obter data atual do exame
    const dataAtual = (typeof resultados[nomeExame] === 'object' && resultados[nomeExame] !== null 
      ? (resultados[nomeExame] as Record<string, string>)[`data${trimestre}`] 
      : "") || "";
    
    // Função para selecionar um item do histórico como ativo
    const handleSelecionarHistorico = (item: { id: number; resultado: string; dataExame: string | null }) => {
      // Atualizar o resultado e a data com os valores do histórico selecionado
      handleResultadoChange(nomeExame, chave, item.resultado);
      if (item.dataExame) {
        handleResultadoChange(nomeExame, `data${trimestre}`, item.dataExame);
      }
    };
    
    // Verificar se é um exame sorológico
    const ehSorologico = EXAMES_SOROLOGICOS.includes(nomeExame);
    
    // Verificar se é EAS (Urina tipo 1)
    const ehEAS = nomeExame === "EAS (Urina tipo 1)";
    
    // Verificar se é Urocultura
    const ehUrocultura = nomeExame === "Urocultura";
    
    // Verificar se é EPF (Parasitológico de Fezes)
    const ehEPF = nomeExame === "EPF (Parasitológico de Fezes)";
    
    // Renderizar dropdown para EAS (Urina tipo 1) com campo de observações condicional
    if (ehEAS) {
      const chaveObs = subcampo ? `${subcampo}_obs_${trimestre}` : `obs_${trimestre}`;
      const valorObs = (typeof resultados[nomeExame] === 'object' && resultados[nomeExame] !== null ? (resultados[nomeExame] as Record<string, string>)[chaveObs] : "") || "";
      const ehAlterado = valor === "Alterado";
      
      // Handler para atalhos numéricos: 1=Normal, 2=Alterado
      const handleKeyDownEAS = (e: React.KeyboardEvent) => {
        if (e.key === '1') {
          e.preventDefault();
          handleResultadoChange(nomeExame, chave, 'Normal');
        } else if (e.key === '2') {
          e.preventDefault();
          handleResultadoChange(nomeExame, chave, 'Alterado');
        }
      };
      
      return (
        <div className="flex flex-col gap-2 w-full">
          <Select
            value={valor || ""}
            onValueChange={(novoValor) => handleResultadoChange(nomeExame, chave, novoValor)}
          >
            <SelectTrigger 
              className={`w-full ${ehAlterado ? 'border-orange-500 bg-orange-50 text-orange-900' : ''}`}
              data-field-type="resultado"
              data-trimestre={trimestre}
              onKeyDown={(e) => {
                handleKeyDownEAS(e);
                if (e.key === 'Tab' && !e.shiftKey) {
                  const navegou = navegarParaProximoResultado(trimestre);
                  if (navegou) {
                    e.preventDefault();
                  }
                }
              }}
              title="Atalhos: 1=Normal, 2=Alterado"
            >
              <SelectValue placeholder="1/2" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Normal">Normal</SelectItem>
              <SelectItem value="Alterado">Alterado</SelectItem>
            </SelectContent>
          </Select>
          {valor === "Alterado" && (
            <Input
              type="text"
              value={valorObs}
              onChange={(e) => handleResultadoChange(nomeExame, chaveObs, e.target.value)}
              placeholder="Especifique a alteração (ex: leucócitos, hemácias...)" 
              className="w-full text-xs"
            />
          )}
        </div>
      );
    }
    
    // Renderizar dropdown para Urocultura com campos condicionais
    if (ehUrocultura) {
      const chaveAgente = subcampo ? `${subcampo}_agente_${trimestre}` : `agente_${trimestre}`;
      const chaveAntibiograma = subcampo ? `${subcampo}_antibiograma_${trimestre}` : `antibiograma_${trimestre}`;
      const valorAgente = (typeof resultados[nomeExame] === 'object' && resultados[nomeExame] !== null ? (resultados[nomeExame] as Record<string, string>)[chaveAgente] : "") || "";
      const valorAntibiograma = (typeof resultados[nomeExame] === 'object' && resultados[nomeExame] !== null ? (resultados[nomeExame] as Record<string, string>)[chaveAntibiograma] : "") || "";
      const ehPositiva = valor === "Positiva";
      
      // Handler para atalhos numéricos: 1=Positiva, 2=Negativa
      const handleKeyDownUrocultura = (e: React.KeyboardEvent) => {
        if (e.key === '1') {
          e.preventDefault();
          handleResultadoChange(nomeExame, chave, 'Positiva');
        } else if (e.key === '2') {
          e.preventDefault();
          handleResultadoChange(nomeExame, chave, 'Negativa');
        }
      };
      
      return (
        <div className="flex flex-col gap-2 w-full">
          <Select
            value={valor || ""}
            onValueChange={(novoValor) => handleResultadoChange(nomeExame, chave, novoValor)}
          >
            <SelectTrigger 
              className={`w-full ${ehPositiva ? 'border-red-500 bg-red-50 text-red-900' : ''}`}
              data-field-type="resultado"
              data-trimestre={trimestre}
              onKeyDown={(e) => {
                handleKeyDownUrocultura(e);
                if (e.key === 'Tab' && !e.shiftKey) {
                  const navegou = navegarParaProximoResultado(trimestre);
                  if (navegou) {
                    e.preventDefault();
                  }
                }
              }}
              title="Atalhos: 1=Positiva, 2=Negativa"
            >
              <SelectValue placeholder="1/2" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Positiva">Positiva</SelectItem>
              <SelectItem value="Negativa">Negativa</SelectItem>
            </SelectContent>
          </Select>
          {valor === "Positiva" && (
            <>
              <Input
                type="text"
                value={valorAgente}
                onChange={(e) => handleResultadoChange(nomeExame, chaveAgente, e.target.value)}
                placeholder="Agente infeccioso (ex: E. coli, Proteus...)" 
                className="w-full text-xs"
              />
              <Input
                type="text"
                value={valorAntibiograma}
                onChange={(e) => handleResultadoChange(nomeExame, chaveAntibiograma, e.target.value)}
                placeholder="Antibiograma (sensibilidade aos antibióticos)" 
                className="w-full text-xs"
              />
            </>
          )}
        </div>
      );
    }
    
    // Renderizar dropdown para EPF (Parasitológico de Fezes)
    if (ehEPF) {
      const ehPositivo = valor === "Positivo";
      
      // Handler para atalhos numéricos: 1=Positivo, 2=Negativo
      const handleKeyDownEPF = (e: React.KeyboardEvent) => {
        if (e.key === '1') {
          e.preventDefault();
          handleResultadoChange(nomeExame, chave, 'Positivo');
        } else if (e.key === '2') {
          e.preventDefault();
          handleResultadoChange(nomeExame, chave, 'Negativo');
        }
      };
      
      return (
        <Select
          value={valor || ""}
          onValueChange={(novoValor) => handleResultadoChange(nomeExame, chave, novoValor)}
        >
          <SelectTrigger 
            className={`w-full ${ehPositivo ? 'border-red-500 bg-red-50 text-red-900' : ''}`}
            data-field-type="resultado"
            data-trimestre={trimestre}
            onKeyDown={(e) => {
              handleKeyDownEPF(e);
              if (e.key === 'Tab' && !e.shiftKey) {
                const navegou = navegarParaProximoResultado(trimestre);
                if (navegou) {
                  e.preventDefault();
                }
              }
            }}
            title="Atalhos: 1=Positivo, 2=Negativo"
          >
            <SelectValue placeholder="1/2" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Positivo">Positivo</SelectItem>
            <SelectItem value="Negativo">Negativo</SelectItem>
          </SelectContent>
        </Select>
      );
    }
    
    // Renderizar Select para exames sorológicos
    if (ehSorologico) {
      const ehReagente = valor === "Reagente";
      const ehNaoReagente = valor === "Não Reagente";
      const ehIndeterminado = valor === "Indeterminado";
      
      // Determinar se é IgG ou IgM para definir a cor quando reagente
      // IgG reagente = verde (indica imunidade, é bom)
      // IgM reagente = vermelho (indica infecção recente, é preocupante)
      const ehIgG = nomeExame.includes('IgG');
      const ehIgM = nomeExame.includes('IgM');
      const ehAntiHBs = nomeExame.includes('Anti-HBs');
      
      // Definir classes de cor baseado no tipo de exame e resultado
      let corResultado = '';
      if (ehReagente) {
        if (ehIgG || ehAntiHBs) {
          // IgG reagente ou Anti-HBs reagente = verde (indica imunidade)
          corResultado = 'border-green-500 bg-green-50 text-green-900';
        } else if (ehIgM) {
          corResultado = 'border-red-500 bg-red-50 text-red-900';
        } else {
          // Para outros exames sorológicos (HIV, Hepatites, etc), manter vermelho
          corResultado = 'border-red-500 bg-red-50 text-red-900';
        }
      } else if (ehNaoReagente) {
        // Não Reagente = verde (resultado normal/bom para a maioria dos exames)
        corResultado = 'border-green-500 bg-green-50 text-green-900';
      }
      
      // Handler para atalhos numéricos: 1=Reagente, 2=Não Reagente, 3=Indeterminado
      const handleKeyDownSorologico = (e: React.KeyboardEvent) => {
        if (e.key === '1') {
          e.preventDefault();
          handleResultadoChange(nomeExame, chave, 'Reagente');
        } else if (e.key === '2') {
          e.preventDefault();
          handleResultadoChange(nomeExame, chave, 'Não Reagente');
        } else if (e.key === '3') {
          e.preventDefault();
          handleResultadoChange(nomeExame, chave, 'Indeterminado');
        }
      };
      
      return (
        <Select
          value={valor || ""}
          onValueChange={(novoValor) => handleResultadoChange(nomeExame, chave, novoValor)}
        >
          <SelectTrigger 
            className={`w-full ${corResultado} ${ehIndeterminado ? 'border-yellow-500 bg-yellow-50 text-yellow-900' : ''}`}
            data-field-type="resultado"
            data-trimestre={trimestre}
            onKeyDown={(e) => {
              handleKeyDownSorologico(e);
              if (e.key === 'Tab' && !e.shiftKey) {
                const navegou = navegarParaProximoResultado(trimestre);
                if (navegou) {
                  e.preventDefault();
                }
              }
            }}
            title="Atalhos: 1=Reagente, 2=Não Reagente, 3=Indeterminado"
          >
            <SelectValue placeholder="1/2/3" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Reagente">Reagente</SelectItem>
            <SelectItem value="Não Reagente">Não Reagente</SelectItem>
            <SelectItem value="Indeterminado">Indeterminado</SelectItem>
          </SelectContent>
        </Select>
      );
    }
    
    // Renderizar Input para exames não-sorológicos com botão de histórico
    return (
      <div className="flex items-center gap-1">
        <InputExameValidado
          nomeExame={obterIdValidacao(nomeExame) || nomeExame}
          trimestre={trimestre}
          value={valor}
          onChange={(novoValor) => handleResultadoChange(nomeExame, chave, novoValor)}
          onKeyDown={(e) => {
            if (e.key === 'Tab' && !e.shiftKey) {
              const navegou = navegarParaProximoResultado(trimestre);
              if (navegou) {
                e.preventDefault();
              }
            }
          }}
          className="flex-1"
        />
        {historicoDoExame.length > 1 && (
          <HistoricoExamePopover
            nomeExame={nomeExame}
            trimestre={trimestre}
            historico={historicoDoExame}
            valorAtual={valor}
            dataAtual={dataAtual}
            onExcluir={(id) => excluirResultadoMutation.mutate({ id })}
            onSelecionarAtivo={handleSelecionarHistorico}
          />
        )}
      </div>
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
                      className={`w-full text-xs ${(typeof resultados[exame.nome] === 'object' && resultados[exame.nome] !== null && exame.subcampos?.some(sc => (resultados[exame.nome] as Record<string, string>)[`${sc}_1`]?.trim())) ? 'border-green-500 bg-green-50' : ''}`}
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
                      className={`w-full text-xs ${(typeof resultados[exame.nome] === 'object' && resultados[exame.nome] !== null && exame.subcampos?.some(sc => (resultados[exame.nome] as Record<string, string>)[`${sc}_2`]?.trim())) ? 'border-green-500 bg-green-50' : ''}`}
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
                      className={`w-full text-xs ${(typeof resultados[exame.nome] === 'object' && resultados[exame.nome] !== null && exame.subcampos?.some(sc => (resultados[exame.nome] as Record<string, string>)[`${sc}_3`]?.trim())) ? 'border-green-500 bg-green-50' : ''}`}
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
                className={`w-full text-xs ${(typeof resultados[exame.nome] === 'object' && resultados[exame.nome] !== null && (resultados[exame.nome] as Record<string, string>)["1"]?.trim()) ? 'border-green-500 bg-green-50' : ''}`}
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
                className={`w-full text-xs ${(typeof resultados[exame.nome] === 'object' && resultados[exame.nome] !== null && (resultados[exame.nome] as Record<string, string>)["2"]?.trim()) ? 'border-green-500 bg-green-50' : ''}`}
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
                className={`w-full text-xs ${(typeof resultados[exame.nome] === 'object' && resultados[exame.nome] !== null && (resultados[exame.nome] as Record<string, string>)["3"]?.trim()) ? 'border-green-500 bg-green-50' : ''}`}
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
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-1/6">Exame</TableHead>
              <TableHead className="text-center w-1/12">Data 1º Tri</TableHead>
              <TableHead className="text-center w-1/6">Resultado 1º Tri</TableHead>
              <TableHead className="text-center w-1/12">Data 2º Tri</TableHead>
              <TableHead className="text-center w-1/6">Resultado 2º Tri</TableHead>
              <TableHead className="text-center w-1/12">Data 3º Tri</TableHead>
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
                {/* Barras de Ação em Lote - Aparecem apenas uma vez */}
                <div className="space-y-3">
                  {/* Botão Interpretar com IA */}
                  <div className="flex flex-wrap gap-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">Preencher exames automaticamente:</span>
                    </div>
                    <Button 
                      variant="outline"
                      size="sm"
                      className="bg-white border-purple-600 text-purple-600 hover:bg-purple-100"
                      onClick={() => setModalAberto(true)}
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      Interpretar com IA
                    </Button>
                  </div>
                  
                  {/* Botões de Preenchimento em Lote */}
                  <div className="flex flex-wrap gap-4 p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">Preencher exames qualitativos em lote:</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-white hover:bg-green-100 border-green-300 text-green-700"
                      onClick={() => abrirModalPreenchimentoLote(1)}
                      title="Abre seletor para escolher quais exames marcar como Normal/Negativo ou Alterado/Positivo"
                    >
                      1º Trimestre
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-white hover:bg-green-100 border-green-300 text-green-700"
                      onClick={() => abrirModalPreenchimentoLote(2)}
                      title="Abre seletor para escolher quais exames marcar como Normal/Negativo ou Alterado/Positivo"
                    >
                      2º Trimestre
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-white hover:bg-green-100 border-green-300 text-green-700"
                      onClick={() => abrirModalPreenchimentoLote(3)}
                      title="Abre seletor para escolher quais exames marcar como Normal/Negativo ou Alterado/Positivo"
                    >
                      3º Trimestre
                    </Button>
                  </div>
                </div>
                
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

                {/* Botões de exclusão por trimestre */}
                <div className="flex flex-wrap gap-2 mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <span className="text-sm text-gray-600 font-medium mr-2 self-center">Limpar todos os exames do:</span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
                    onClick={() => {
                      setTrimestreParaExcluir(1);
                      setModalExcluirTrimestreAberto(true);
                    }}
                  >
                    1º Trimestre
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
                    onClick={() => {
                      setTrimestreParaExcluir(2);
                      setModalExcluirTrimestreAberto(true);
                    }}
                  >
                    2º Trimestre
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
                    onClick={() => {
                      setTrimestreParaExcluir(3);
                      setModalExcluirTrimestreAberto(true);
                    }}
                  >
                    3º Trimestre
                  </Button>
                </div>

                <div className="flex justify-end items-center mt-6">
                  <Button 
                    className="bg-rose-600 hover:bg-rose-700"
                    onClick={handleSalvar}
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
                  gestanteId={gestanteSelecionada}
                  dumGestante={gestante?.dum && gestante.dum !== "Incerta" && gestante.dum !== "Incompatível com US" ? new Date(gestante.dum) : null}
                  dppUltrassom={gestante?.calculado?.dppUS ? new Date(gestante.calculado.dppUS) : null}
                  onResultados={(novosResultados, trimestre, dataColeta, arquivosProcessados, modoAutomatico) => {
                    console.log('[DEBUG FRONTEND] onResultados chamado');
                    console.log('[DEBUG FRONTEND] novosResultados:', novosResultados);
                    console.log('[DEBUG FRONTEND] trimestre:', trimestre);
                    console.log('[DEBUG FRONTEND] dataColeta:', dataColeta);
                    console.log('[DEBUG FRONTEND] modoAutomatico:', modoAutomatico);
                    
                    // Converter resultados da IA para o formato esperado
                    const trimestreNumPadrao = trimestre === "primeiro" ? "1" : trimestre === "segundo" ? "2" : "3";
                    const resultadosFormatados: Record<string, Record<string, string> | string> = {};
                    
                    // Função para calcular trimestre baseado na data de coleta e DUM
                    const calcularTrimestreAutomatico = (dataColeta: string, dum: Date | null): string => {
                      if (!dum || !dataColeta) return trimestreNumPadrao;
                      try {
                        const data = new Date(dataColeta);
                        const diffMs = data.getTime() - dum.getTime();
                        const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                        const semanas = Math.floor(diffDias / 7);
                        
                        if (semanas <= 13) return "1";
                        if (semanas <= 27) return "2";
                        return "3";
                      } catch {
                        return trimestreNumPadrao;
                      }
                    };
                    
                    // Usar DUM se disponível, senão calcular DUM estimada a partir da DPP pelo Ultrassom
                    const dumGestanteDate = gestante?.dum && gestante.dum !== "Incerta" && gestante.dum !== "Incompatível com US" 
                      ? new Date(gestante.dum) 
                      : gestante?.calculado?.dppUS 
                        ? new Date(new Date(gestante.calculado.dppUS).getTime() - 280 * 24 * 60 * 60 * 1000) // DUM estimada = DPP - 280 dias
                        : null;
                    
                    // Função para normalizar valores de exames para o formato esperado pelos dropdowns
                    const normalizarValorExame = (nomeExame: string, valor: string): { valorNormalizado: string; camposExtras?: Record<string, string> } => {
                      const valorLower = valor.toLowerCase().trim();
                      const camposExtras: Record<string, string> = {};
                      
                      // Exames sorológicos: Reagente/Não Reagente/Indeterminado
                      if (EXAMES_SOROLOGICOS.includes(nomeExame)) {
                        if (valorLower.includes('não reagente') || valorLower.includes('nao reagente') || valorLower.includes('negativo')) {
                          return { valorNormalizado: 'Não Reagente' };
                        }
                        if (valorLower.includes('reagente') || valorLower.includes('positivo')) {
                          return { valorNormalizado: 'Reagente' };
                        }
                        if (valorLower.includes('indeterminado') || valorLower.includes('inconclusivo')) {
                          return { valorNormalizado: 'Indeterminado' };
                        }
                      }
                      
                      // EAS (Urina tipo 1): Normal/Alterado
                      if (nomeExame === 'EAS (Urina tipo 1)') {
                        if (valorLower.includes('alterada') || valorLower.includes('alterado') || valorLower.includes('anormal')) {
                          // Extrair observação se houver
                          const match = valor.match(/[Aa]lterada?\s*[-–:]?\s*(.+)/i);
                          if (match && match[1]) {
                            camposExtras.observacao = match[1].trim();
                          }
                          return { valorNormalizado: 'Alterado', camposExtras };
                        }
                        if (valorLower.includes('normal') || valorLower === 'negativo') {
                          return { valorNormalizado: 'Normal' };
                        }
                      }
                      
                      // Urocultura: Positiva/Negativa
                      if (nomeExame === 'Urocultura') {
                        if (valorLower.includes('positiva') || valorLower.includes('positivo')) {
                          // Extrair agente infeccioso se houver
                          const match = valor.match(/[Pp]ositiva?\s*[-–:]?\s*(.+)/i);
                          if (match && match[1]) {
                            camposExtras.agente = match[1].trim();
                          }
                          return { valorNormalizado: 'Positiva', camposExtras };
                        }
                        if (valorLower.includes('negativa') || valorLower.includes('negativo')) {
                          return { valorNormalizado: 'Negativa' };
                        }
                      }
                      
                      // EPF (Parasitológico de Fezes): Positivo/Negativo
                      if (nomeExame === 'EPF (Parasitológico de Fezes)') {
                        if (valorLower.includes('positivo')) {
                          return { valorNormalizado: 'Positivo' };
                        }
                        if (valorLower.includes('negativo')) {
                          return { valorNormalizado: 'Negativo' };
                        }
                      }
                      
                      // Retornar valor original se não precisar de normalização
                      return { valorNormalizado: valor };
                    };
                    
                    for (const [chave, valor] of Object.entries(novosResultados)) {
                      console.log(`[DEBUG FRONTEND] Processando: ${chave} = ${valor}`);
                      
                      // A chave pode conter sufixos com trimestre e data:
                      // Formato: "NomeExame::trimestre::data" ou "NomeExame::data"
                      // Isso acontece tanto no modo automático quanto no modo manual
                      let nomeExameBase = chave;
                      let subcampo: string | undefined;
                      let trimestreNum = trimestreNumPadrao;
                      let dataExame = dataColeta;
                      
                      // SEMPRE processar chaves com :: (tanto modo automático quanto manual)
                      if (chave.includes('::')) {
                        const partes = chave.split('::');
                        nomeExameBase = partes[0];
                        
                        // Verificar se partes[1] é uma data (YYYY-MM-DD) ou um número de trimestre
                        if (partes[1]) {
                          if (/^\d{4}-\d{2}-\d{2}$/.test(partes[1])) {
                            // É uma data - calcular trimestre automaticamente se modo automático
                            // ou usar trimestre padrão se modo manual
                            dataExame = partes[1];
                            if (modoAutomatico) {
                              trimestreNum = calcularTrimestreAutomatico(dataExame, dumGestanteDate);
                            }
                            console.log(`[DEBUG FRONTEND] Data detectada: ${dataExame}, trimestre: ${trimestreNum}`);
                          } else if (/^[123]$/.test(partes[1])) {
                            // É um número de trimestre (1, 2 ou 3)
                            // No modo manual, usar o trimestre selecionado pelo usuário
                            // No modo automático, usar o trimestre extraído
                            if (modoAutomatico) {
                              trimestreNum = partes[1];
                            }
                            if (partes[2]) dataExame = partes[2];
                          }
                        }
                      }
                      
                      // Detectar se é um exame com subcampo (formato: "NomeExame__Subcampo")
                      if (nomeExameBase.includes('__')) {
                        console.log(`[DEBUG FRONTEND] Detectado subcampo em: ${nomeExameBase}`);
                        const [nomeExame, sub] = nomeExameBase.split('__');
                        subcampo = sub;
                        nomeExameBase = nomeExame;
                        
                        // Inicializar objeto do exame se não existir
                        if (!resultadosFormatados[nomeExameBase]) {
                          const existente = resultados[nomeExameBase];
                          resultadosFormatados[nomeExameBase] = {
                            ...(typeof existente === 'object' && existente !== null ? existente as Record<string, string> : {}),
                          };
                        }
                        
                        // Adicionar subcampo ao trimestre correspondente
                        const subcampoKey = `${subcampo}_${trimestreNum}`;
                        console.log(`[DEBUG FRONTEND] subcampoKey: ${subcampoKey}`);
                        (resultadosFormatados[nomeExameBase] as Record<string, string>)[subcampoKey] = valor;
                        
                        // Adicionar data para o trimestre (uma vez por exame)
                        if (dataExame && !(resultadosFormatados[nomeExameBase] as Record<string, string>)[`data${trimestreNum}`]) {
                          (resultadosFormatados[nomeExameBase] as Record<string, string>)[`data${trimestreNum}`] = dataExame;
                        }
                      } else {
                        // Exame simples (sem subcampos)
                        // Normalizar o valor para o formato esperado pelo dropdown
                        const { valorNormalizado, camposExtras } = normalizarValorExame(nomeExameBase, valor);
                        console.log(`[DEBUG FRONTEND] Valor normalizado: ${valor} -> ${valorNormalizado}`);
                        
                        const existente = resultados[nomeExameBase];
                        resultadosFormatados[nomeExameBase] = {
                          ...(typeof existente === 'object' && existente !== null ? existente as Record<string, string> : {}),
                          [trimestreNum]: valorNormalizado,
                          ...(dataExame ? { [`data${trimestreNum}`]: dataExame } : {}),
                        };
                        
                        // Adicionar campos extras (observação para EAS, agente para Urocultura)
                        if (camposExtras) {
                          if (camposExtras.observacao) {
                            (resultadosFormatados[nomeExameBase] as Record<string, string>)[`obs_${trimestreNum}`] = camposExtras.observacao;
                          }
                          if (camposExtras.agente) {
                            (resultadosFormatados[nomeExameBase] as Record<string, string>)[`agente_${trimestreNum}`] = camposExtras.agente;
                          }
                        }
                      }
                    }
                    
                    console.log('[DEBUG FRONTEND] resultadosFormatados:', resultadosFormatados);
                    
                    setResultados(prev => {
                      const novoEstado = { ...prev };
                      let camposAdicionados = 0;
                      let camposIgnorados = 0;
                      
                      // Mesclar resultados sem sobrescrever campos já preenchidos
                      for (const [nomeExame, novoValor] of Object.entries(resultadosFormatados)) {
                        if (typeof novoValor === 'object' && novoValor !== null) {
                          // Exame com subcampos (objeto)
                          const existente = prev[nomeExame];
                          const existenteObj = typeof existente === 'object' && existente !== null 
                            ? existente as Record<string, string> 
                            : {};
                          
                          const mesclado: Record<string, string> = { ...existenteObj };
                          
                          for (const [campo, valor] of Object.entries(novoValor as Record<string, string>)) {
                            // Verificar se o campo já tem valor preenchido
                            const valorExistente = existenteObj[campo];
                            const campoJaPreenchido = valorExistente && valorExistente.trim() !== '';
                            
                            if (campoJaPreenchido) {
                              console.log(`[DEBUG FRONTEND] Campo ${nomeExame}.${campo} já preenchido com "${valorExistente}", ignorando novo valor "${valor}"`);
                              camposIgnorados++;
                            } else {
                              mesclado[campo] = valor;
                              camposAdicionados++;
                              console.log(`[DEBUG FRONTEND] Campo ${nomeExame}.${campo} preenchido com "${valor}"`);
                            }
                          }
                          
                          novoEstado[nomeExame] = mesclado;
                        } else {
                          // Exame simples (string)
                          const valorExistente = prev[nomeExame];
                          const campoJaPreenchido = valorExistente && 
                            typeof valorExistente === 'string' && 
                            valorExistente.trim() !== '';
                          
                          if (campoJaPreenchido) {
                            console.log(`[DEBUG FRONTEND] Exame ${nomeExame} já preenchido com "${valorExistente}", ignorando novo valor "${novoValor}"`);
                            camposIgnorados++;
                          } else {
                            novoEstado[nomeExame] = novoValor;
                            camposAdicionados++;
                            console.log(`[DEBUG FRONTEND] Exame ${nomeExame} preenchido com "${novoValor}"`);
                          }
                        }
                      }
                      
                      console.log(`[DEBUG FRONTEND] Resumo: ${camposAdicionados} campos adicionados, ${camposIgnorados} campos ignorados (já preenchidos)`);
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
        
        {/* Modal de Preenchimento em Lote */}
        <Dialog open={modalPreenchimentoLoteAberto} onOpenChange={setModalPreenchimentoLoteAberto}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Preencher Exames Qualitativos - {trimestrePreenchimentoLote}º Trimestre</DialogTitle>
              <DialogDescription>
                Marque os exames que deseja incluir e escolha o resultado para cada um.
              </DialogDescription>
            </DialogHeader>
            
            {/* Campo de Data do Lote */}
            <div className="flex items-center gap-4 py-3 px-4 bg-rose-50 rounded-lg border border-rose-200">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-rose-600" />
                <label htmlFor="dataLote" className="text-sm font-medium text-gray-700">
                  Data de Coleta do Lote:
                </label>
              </div>
              <input
                id="dataLote"
                type="date"
                value={dataPreenchimentoLote}
                onChange={(e) => setDataPreenchimentoLote(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-rose-500 focus:border-rose-500 text-sm"
              />
              <span className="text-xs text-gray-500">
                Esta data será aplicada a todos os exames preenchidos
              </span>
            </div>
            
            {/* Botões de Ação em Lote */}
            <div className="flex flex-wrap gap-3 py-3 border-b">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSelecionarTodosExames}
              >
                {examesSelecionadosLote.size === obterExamesQualitativos(trimestrePreenchimentoLote).length 
                  ? "Desmarcar Todos" 
                  : "Selecionar Todos"
                }
              </Button>
              <div className="border-l mx-2" />
              <Button
                variant="outline"
                size="sm"
                className="bg-green-50 hover:bg-green-100 border-green-300 text-green-700"
                onClick={() => marcarTodosNoModal("normal")}
              >
                <Check className="mr-2 h-4 w-4" />
                Todos Normal/Negativo
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="bg-red-50 hover:bg-red-100 border-red-300 text-red-700"
                onClick={() => marcarTodosNoModal("alterado")}
              >
                Todos Alterado/Positivo
              </Button>
            </div>
            
            {/* Lista de Exames com Checkboxes */}
            <div className="space-y-2 py-4">
              {obterExamesQualitativos(trimestrePreenchimentoLote).map((exame) => {
                const estaSelecionado = examesSelecionadosLote.has(exame.nome);
                return (
                  <div 
                    key={exame.nome} 
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                      !estaSelecionado 
                        ? "bg-gray-50 border-gray-200 opacity-60" 
                        : selecaoExamesLote[exame.nome] === "alterado" 
                          ? "bg-red-50 border-red-200" 
                          : "bg-green-50 border-green-200"
                    }`}
                  >
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={estaSelecionado}
                      onChange={() => toggleExameSelecionado(exame.nome)}
                      className="h-5 w-5 rounded border-gray-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
                    />
                    
                    {/* Nome e Preview */}
                    <div className="flex-1">
                      <span className={`font-medium ${estaSelecionado ? "text-gray-800" : "text-gray-500"}`}>
                        {exame.nome}
                      </span>
                      {estaSelecionado && (
                        <div className="text-xs text-gray-500 mt-1">
                          {selecaoExamesLote[exame.nome] === "normal" 
                            ? `Será preenchido como: ${exame.valorNormal}` 
                            : `Será preenchido como: ${exame.valorAlterado}`
                          }
                        </div>
                      )}
                    </div>
                    
                    {/* Botões de Seleção */}
                    <div className="flex gap-2">
                      <Button
                        variant={selecaoExamesLote[exame.nome] === "normal" ? "default" : "outline"}
                        size="sm"
                        disabled={!estaSelecionado}
                        className={selecaoExamesLote[exame.nome] === "normal" && estaSelecionado
                          ? "bg-green-600 hover:bg-green-700" 
                          : "hover:bg-green-100"
                        }
                        onClick={() => setSelecaoExamesLote(prev => ({ ...prev, [exame.nome]: "normal" }))}
                      >
                        {exame.valorNormal}
                      </Button>
                      <Button
                        variant={selecaoExamesLote[exame.nome] === "alterado" ? "default" : "outline"}
                        size="sm"
                        disabled={!estaSelecionado}
                        className={selecaoExamesLote[exame.nome] === "alterado" && estaSelecionado
                          ? "bg-red-600 hover:bg-red-700" 
                          : "hover:bg-red-100"
                        }
                        onClick={() => setSelecaoExamesLote(prev => ({ ...prev, [exame.nome]: "alterado" }))}
                      >
                        {exame.valorAlterado}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <DialogFooter className="flex justify-between items-center">
              <div className="text-sm text-gray-500">
                {examesSelecionadosLote.size} exame(s) selecionado(s) | {Array.from(examesSelecionadosLote).filter(nome => selecaoExamesLote[nome] === "alterado").length} como alterado
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setModalPreenchimentoLoteAberto(false)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={aplicarPreenchimentoLote}
                  className="bg-rose-600 hover:bg-rose-700"
                >
                  Aplicar Preenchimento
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Modal de Confirmação de Exclusão de Trimestre */}
        <Dialog open={modalExcluirTrimestreAberto} onOpenChange={setModalExcluirTrimestreAberto}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-red-600">Confirmar Exclusão</DialogTitle>
              <DialogDescription>
                Você está prestes a apagar <strong>todos os exames e datas</strong> do <strong>{trimestreParaExcluir}º Trimestre</strong>.
                Esta ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-gray-600">
                Todos os resultados e datas preenchidos para o {trimestreParaExcluir}º trimestre serão removidos.
                Você precisará clicar em "Salvar Resultados" para confirmar a exclusão no banco de dados.
              </p>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setModalExcluirTrimestreAberto(false);
                  setTrimestreParaExcluir(null);
                }}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                className="bg-red-600 hover:bg-red-700"
                onClick={() => {
                  if (!trimestreParaExcluir) return;
                  
                  // Limpar todos os campos do trimestre selecionado
                  setResultados(prev => {
                    const novosResultados = { ...prev };
                    
                    for (const [chave, valor] of Object.entries(novosResultados)) {
                      if (typeof valor === 'object' && valor !== null) {
                        const novoValor = { ...valor };
                        
                        // Remover campos do trimestre
                        delete novoValor[trimestreParaExcluir.toString()];
                        delete novoValor[`data${trimestreParaExcluir}`];
                        delete novoValor[`obs_${trimestreParaExcluir}`];
                        delete novoValor[`agente_${trimestreParaExcluir}`];
                        
                        // Remover subcampos do trimestre (para exames como TTGO)
                        for (const key of Object.keys(novoValor)) {
                          if (key.endsWith(`_${trimestreParaExcluir}`)) {
                            delete novoValor[key];
                          }
                        }
                        
                        novosResultados[chave] = novoValor;
                      }
                    }
                    
                    return novosResultados;
                  });
                  
                  toast.success(`Exames do ${trimestreParaExcluir}º trimestre removidos`, {
                    description: 'Clique em "Salvar Resultados" para confirmar a exclusão.',
                  });
                  
                  setModalExcluirTrimestreAberto(false);
                  setTrimestreParaExcluir(null);
                }}
              >
                Confirmar Exclusão
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Seção de Arquivos de Exames - Histórico de Interpretações */}
        {gestanteSelecionada && (
          <div className="mt-8">
            <ArquivosExamesSection gestanteId={gestanteSelecionada} />
          </div>
        )}
      </div>
    </GestantesLayout>
  );
}
