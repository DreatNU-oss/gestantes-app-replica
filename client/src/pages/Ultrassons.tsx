import React, { useState, useEffect } from "react";
import { trpc } from '@/lib/trpc';
import GestantesLayout from '@/components/GestantesLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { TextareaComAutocomplete } from '@/components/TextareaComAutocomplete';
import { Separator } from '@/components/ui/separator';
import { Loader2, Save, ArrowLeft, Sparkles, Check, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useInstantSave } from '@/hooks/useInstantSave';
import { toast } from 'sonner';
import { useLocation } from 'wouter';
import { useGestanteAtiva } from '@/contexts/GestanteAtivaContext';
import { InterpretarUltrassomModal } from '@/components/InterpretarUltrassomModal';
import { UltrassomFormularioSalvo } from '@/components/UltrassomFormularioSalvo';
import { HistoricoInterpretacoes } from '@/components/HistoricoInterpretacoes';
import { normalizeDadosDatas } from '@shared/dateNormalization';


export default function Ultrassons() {
  const [, setLocation] = useLocation();
  const { gestanteAtiva } = useGestanteAtiva();
  const [gestanteSelecionada, setGestanteSelecionada] = useState<number | null>(gestanteAtiva?.id || null);
  
  // Atualizar gestante selecionada quando gestante ativa mudar
  React.useEffect(() => {
    if (gestanteAtiva) {
      setGestanteSelecionada(gestanteAtiva.id);
      setBusca(gestanteAtiva.nome); // Pré-preencher campo de busca com nome da gestante
      
      // Limpar todos os formulários de ultrassom ao trocar de gestante
      setPrimeiroUS({
        dataExame: '',
        idadeGestacional: '',
        ccn: '',
        bcf: '',
        sacoVitelino: '',
        hematoma: '',
        corpoLuteo: '',
        coloUterino: '',
        dpp: '',
      });
      setMorfo1Tri({
        dataExame: '',
        idadeGestacional: '',
        tn: '',
        dv: '',
        valvaTricuspide: '',
        dopplerUterinas: '',
        incisuraPresente: '',
        colo: '',
        riscoTrissomias: '',
      });
      setUsObstetrico({
        dataExame: '',
        idadeGestacional: '',
        pesoFetal: '',
        placentaLocalizacao: '',
        placentaGrau: '',
        coloUterinoMedida: '',
      });
      setMorfo2Tri({
        dataExame: '',
        idadeGestacional: '',
        biometria: '',
        pesoFetal: '',
        placentaLocalizacao: '',
        placentaGrau: '',
        liquidoAmniotico: '',
        coloUterino: '',
        avaliacaoAnatomica: '',
        dopplers: '',
        sexoFetal: '',
        observacoes: '',
      });
      setEcocardiograma({
        dataExame: '',
        conclusao: '',
      });
      setUsSeguimento({
        dataExame: '',
        idadeGestacional: '',
        pesoFetal: '',
        percentilPeso: '',
        liquidoAmniotico: '',
        placentaLocalizacao: '',
        placentaGrau: '',
        coloUterino: '',
        movimentosFetais: '',
        apresentacaoFetal: '',
        dopplers: '',
        observacoes: '',
      });
      
      // Limpar destaques de IA
      setCamposPreenchidosIA({
        primeiro_ultrassom: new Set(),
        morfologico_1tri: new Set(),
        ultrassom_obstetrico: new Set(),
        morfologico_2tri: new Set(),
        ecocardiograma: new Set(),
        ultrassom_seguimento: new Set(),
      });
    }
  }, [gestanteAtiva]);
  const [busca, setBusca] = useState(gestanteAtiva?.nome || '');
  const [modalInterpretarAberto, setModalInterpretarAberto] = useState(false);
  
  // Buscar gestantes
  const { data: gestantes, isLoading: loadingGestantes } = trpc.gestantes.list.useQuery();
  
  // Buscar ultrassons da gestante selecionada
  const { data: ultrassons, refetch: refetchUltrassons } = trpc.ultrassons.buscar.useQuery(
    { gestanteId: gestanteSelecionada! },
    { enabled: !!gestanteSelecionada }
  );
  
  // Mutation para salvar
  const salvarMutation = trpc.ultrassons.salvar.useMutation({
    onSuccess: (data) => {
      // Limpar rascunho do tipo de ultrassom salvo
      const tipoUS = (data as any).ultrassom?.tipoUltrassom;
      switch (tipoUS) {
        case 'primeiro_ultrassom':
          primeiroUSAutoSave.clearDraft();
          break;
        case 'morfologico_1tri':
          morfo1TriAutoSave.clearDraft();
          break;
        case 'obstetrico':
          usObstetricoAutoSave.clearDraft();
          break;
        case 'morfologico_2tri':
          morfo2TriAutoSave.clearDraft();
          break;
        case 'ecocardiograma':
          ecocardiogramaAutoSave.clearDraft();
          break;
        case 'seguimento':
          usSeguimentoAutoSave.clearDraft();
          break;
      }
      
      toast.success('✅ Ultrassom salvo com sucesso!', {
        description: 'Os dados do ultrassom foram salvos no sistema.',
        duration: 4000,
      });
      refetchUltrassons();
    },
    onError: (error) => {
      toast.error('❌ Erro ao salvar ultrassom', {
        description: error.message,
        duration: 5000,
      });
    },
  });
  
  // Mutation para deletar ultrassom
  const deletarMutation = trpc.ultrassons.deletar.useMutation({
    onSuccess: () => {
      toast.success('🗑️ Ultrassom apagado com sucesso!', {
        description: 'Os dados do ultrassom foram removidos.',
        duration: 4000,
      });
      refetchUltrassons();
    },
    onError: (error) => {
      toast.error('❌ Erro ao apagar ultrassom', {
        description: error.message,
        duration: 5000,
      });
    },
  });

  // Função para apagar ultrassom por ID específico
  const handleApagar = async (tipoUltrassom: string, usId?: number) => {
    if (!ultrassons) return;
    const targetId = usId || editingIds[tipoUltrassom];
    if (!targetId) {
      toast.error('⚠️ Nenhum ultrassom selecionado para apagar', {
        description: 'Selecione um ultrassom para editar antes de apagar.',
        duration: 4000,
      });
      return;
    }
    await deletarMutation.mutateAsync({ id: targetId });
    // Limpar editingId se era o registro sendo editado
    if (editingIds[tipoUltrassom] === targetId) {
      setEditingIds(prev => ({ ...prev, [tipoUltrassom]: null }));
    }
    // Limpar o formulário correspondente
    switch (tipoUltrassom) {
      case 'primeiro_ultrassom':
        setPrimeiroUS({ dataExame: '', idadeGestacional: '', ccn: '', bcf: '', sacoVitelino: '', hematoma: '', corpoLuteo: '', coloUterino: '', dpp: '' });
        primeiroUSAutoSave.clearDraft();
        break;
      case 'morfologico_1tri':
        setMorfo1Tri({ dataExame: '', idadeGestacional: '', tn: '', dv: '', valvaTricuspide: '', dopplerUterinas: '', incisuraPresente: '', colo: '', riscoTrissomias: '' });
        morfo1TriAutoSave.clearDraft();
        break;
      case 'ultrassom_obstetrico':
        setUsObstetrico({ dataExame: '', idadeGestacional: '', pesoFetal: '', placentaLocalizacao: '', placentaGrau: '', coloUterinoMedida: '' });
        usObstetricoAutoSave.clearDraft();
        break;
      case 'morfologico_2tri':
        setMorfo2Tri({ dataExame: '', idadeGestacional: '', biometria: '', pesoFetal: '', placentaLocalizacao: '', placentaGrau: '', liquidoAmniotico: '', coloUterino: '', avaliacaoAnatomica: '', dopplers: '', sexoFetal: '', observacoes: '' });
        morfo2TriAutoSave.clearDraft();
        break;
      case 'ecocardiograma_fetal':
        setEcocardiograma({ dataExame: '', conclusao: '' });
        ecocardiogramaAutoSave.clearDraft();
        break;
      case 'ultrassom_seguimento':
        setUsSeguimento({ dataExame: '', idadeGestacional: '', pesoFetal: '', percentilPeso: '', liquidoAmniotico: '', placentaLocalizacao: '', placentaGrau: '', coloUterino: '', movimentosFetais: '', apresentacaoFetal: '', dopplers: '', observacoes: '' });
        usSeguimentoAutoSave.clearDraft();
        break;
    }
    limparDestaquesIA(tipoUltrassom);
  };

  // Mutation para salvar histórico de interpretações
  const salvarHistoricoMutation = trpc.historicoInterpretacoes.salvar.useMutation();
  
  // Estado para rastrear campos preenchidos pela IA (para destaque visual)
  const [camposPreenchidosIA, setCamposPreenchidosIA] = useState<Record<string, Set<string>>>({
    primeiro_ultrassom: new Set(),
    morfologico_1tri: new Set(),
    ultrassom_obstetrico: new Set(),
    morfologico_2tri: new Set(),
    ecocardiograma: new Set(),
    ultrassom_seguimento: new Set(),
  });
  
  // Função para verificar se um campo foi preenchido pela IA
  const isCampoPreenchidoIA = (tipoUS: string, campo: string): boolean => {
    return camposPreenchidosIA[tipoUS]?.has(campo) || false;
  };
  
  // Função para remover destaque de um campo quando editado manualmente
  const removerDestaqueIA = (tipoUS: string, campo: string) => {
    setCamposPreenchidosIA(prev => {
      const novoSet = new Set(prev[tipoUS]);
      novoSet.delete(campo);
      return { ...prev, [tipoUS]: novoSet };
    });
  };
  
  // Função para limpar todos os destaques de um tipo de ultrassom (após salvar)
  const limparDestaquesIA = (tipoUS: string) => {
    setCamposPreenchidosIA(prev => ({
      ...prev,
      [tipoUS]: new Set(),
    }));
  };
  
  // Classe CSS para destaque amarelo
  const getInputClassName = (tipoUS: string, campo: string): string => {
    return isCampoPreenchidoIA(tipoUS, campo)
      ? 'bg-yellow-100 border-yellow-400 ring-2 ring-yellow-300 ring-opacity-50 transition-all duration-300'
      : '';
  };
  
  // Estado para rastrear qual registro está sendo editado (null = novo)
  const [editingIds, setEditingIds] = useState<Record<string, number | null>>({
    primeiro_ultrassom: null,
    morfologico_1tri: null,
    ultrassom_obstetrico: null,
    morfologico_2tri: null,
    ecocardiograma_fetal: null,
    ultrassom_seguimento: null,
  });

  // Helper para obter ultrassons salvos de um tipo específico
  const getUltrassonsPorTipo = (tipo: string) => {
    if (!ultrassons) return [];
    return ultrassons
      .filter((u: any) => u.tipoUltrassom === tipo)
      .sort((a: any, b: any) => {
        // Ordenar cronologicamente (mais antigo primeiro)
        if (a.dataExame && b.dataExame) return a.dataExame.localeCompare(b.dataExame);
        return (a.id || 0) - (b.id || 0);
      });
  };

  // Handler para salvar registro existente via UltrassomFormularioSalvo
  const handleSalvarRegistroSalvo = async (tipoUltrassom: string, dados: any) => {
    if (!gestanteSelecionada) return;
    const { _editingId, dataExame, idadeGestacional, ...camposDados } = dados;
    const validacao = validarCamposObrigatorios(tipoUltrassom, dados);
    if (!validacao.valido) {
      toast.error('❌ Campos obrigatórios não preenchidos', {
        description: validacao.mensagem,
        duration: 5000,
      });
      return;
    }
    await salvarMutation.mutateAsync({
      id: _editingId,
      gestanteId: gestanteSelecionada,
      tipoUltrassom: tipoUltrassom as any,
      dataExame: dataExame || undefined,
      idadeGestacional: idadeGestacional || undefined,
      dados: camposDados,
    });
  };

  // Estados para cada tipo de ultrassom
  const [primeiroUS, setPrimeiroUS] = useState({
    dataExame: '',
    idadeGestacional: '',
    ccn: '',
    bcf: '',
    sacoVitelino: '',
    hematoma: '',
    corpoLuteo: '',
    coloUterino: '',
    dpp: '',
  });
  
  const [morfo1Tri, setMorfo1Tri] = useState({
    dataExame: '',
    idadeGestacional: '',
    tn: '',
    dv: '',
    valvaTricuspide: '',
    dopplerUterinas: '',
    incisuraPresente: '',
    colo: '',
    riscoTrissomias: '',
  });
  
  const [usObstetrico, setUsObstetrico] = useState({
    dataExame: '',
    idadeGestacional: '',
    pesoFetal: '',
    placentaLocalizacao: '',
    placentaGrau: '',
    coloUterinoMedida: '',
  });
  
  const [morfo2Tri, setMorfo2Tri] = useState({
    dataExame: '',
    idadeGestacional: '',
    biometria: '',
    pesoFetal: '',
    placentaLocalizacao: '',
    placentaGrau: '',
    liquidoAmniotico: '',
    coloUterino: '',
    avaliacaoAnatomica: '',
    dopplers: '',
    sexoFetal: '',
    observacoes: '',
  });
  
  const [ecocardiograma, setEcocardiograma] = useState({
    dataExame: '',
    conclusao: '',
  });
  
  const [usSeguimento, setUsSeguimento] = useState({
    dataExame: '',
    idadeGestacional: '',
    pesoFetal: '',
    percentilPeso: '',
    liquidoAmniotico: '',
    placentaLocalizacao: '',
    placentaGrau: '',
    coloUterino: '',
    movimentosFetais: '',
    apresentacaoFetal: '',
    dopplers: '',
    observacoes: '',
  });
  
  // Auto-save hooks para cada tipo de ultrassom (500ms padrão)
  const primeiroUSAutoSave = useAutoSave(`us-primeiro-${gestanteSelecionada}`, primeiroUS);
  const morfo1TriAutoSave = useAutoSave(`us-morfo1-${gestanteSelecionada}`, morfo1Tri);
  const usObstetricoAutoSave = useAutoSave(`us-obstetrico-${gestanteSelecionada}`, usObstetrico);
  const morfo2TriAutoSave = useAutoSave(`us-morfo2-${gestanteSelecionada}`, morfo2Tri);
  const ecocardiogramaAutoSave = useAutoSave(`us-eco-${gestanteSelecionada}`, ecocardiograma);
  const usSeguimentoAutoSave = useAutoSave(`us-seguimento-${gestanteSelecionada}`, usSeguimento);
  
  // Salvamento instantâneo para datas de exame (campos críticos)
  useInstantSave(`us-primeiro-data-${gestanteSelecionada}`, primeiroUS.dataExame, !!gestanteSelecionada);
  useInstantSave(`us-morfo1-data-${gestanteSelecionada}`, morfo1Tri.dataExame, !!gestanteSelecionada);
  useInstantSave(`us-obstetrico-data-${gestanteSelecionada}`, usObstetrico.dataExame, !!gestanteSelecionada);
  useInstantSave(`us-morfo2-data-${gestanteSelecionada}`, morfo2Tri.dataExame, !!gestanteSelecionada);
  useInstantSave(`us-eco-data-${gestanteSelecionada}`, ecocardiograma.dataExame, !!gestanteSelecionada);
  useInstantSave(`us-seguimento-data-${gestanteSelecionada}`, usSeguimento.dataExame, !!gestanteSelecionada);
  
  // Formatar timestamps para exibição
  const lastSavedPrimeiroUS = primeiroUSAutoSave.savedAt ? new Date(primeiroUSAutoSave.savedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : null;
  const lastSavedMorfo1Tri = morfo1TriAutoSave.savedAt ? new Date(morfo1TriAutoSave.savedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : null;
  const lastSavedUsObstetrico = usObstetricoAutoSave.savedAt ? new Date(usObstetricoAutoSave.savedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : null;
  const lastSavedMorfo2Tri = morfo2TriAutoSave.savedAt ? new Date(morfo2TriAutoSave.savedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : null;
  const lastSavedEcocardiograma = ecocardiogramaAutoSave.savedAt ? new Date(ecocardiogramaAutoSave.savedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : null;
  const lastSavedUsSeguimento = usSeguimentoAutoSave.savedAt ? new Date(usSeguimentoAutoSave.savedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : null;
  
  // Carregar dados quando gestante é selecionada
  // Função helper para garantir que valores undefined sejam convertidos para string vazia
  const sanitizeDados = (dados: Record<string, any>): Record<string, string> => {
    const sanitized: Record<string, string> = {};
    Object.keys(dados).forEach(key => {
      sanitized[key] = dados[key] || '';
    });
    return sanitized;
  };

  // Função para carregar um ultrassom específico no formulário
  const carregarNoFormulario = (us: any) => {
    const dados = sanitizeDados(us.dados || {});
    setEditingIds(prev => ({ ...prev, [us.tipoUltrassom]: us.id }));
    
    switch (us.tipoUltrassom) {
      case 'primeiro_ultrassom':
        setPrimeiroUS(prev => ({
          ...prev,
          dataExame: us.dataExame || '',
          idadeGestacional: us.idadeGestacional || '',
          ...dados,
        }));
        break;
      case 'morfologico_1tri':
        setMorfo1Tri(prev => ({
          ...prev,
          dataExame: us.dataExame || '',
          idadeGestacional: us.idadeGestacional || '',
          ...dados,
        }));
        break;
      case 'ultrassom_obstetrico':
        setUsObstetrico(prev => ({
          ...prev,
          dataExame: us.dataExame || '',
          idadeGestacional: us.idadeGestacional || '',
          ...dados,
        }));
        break;
      case 'morfologico_2tri':
        setMorfo2Tri(prev => ({
          ...prev,
          dataExame: us.dataExame || '',
          idadeGestacional: us.idadeGestacional || '',
          ...dados,
        }));
        break;
      case 'ecocardiograma_fetal':
        setEcocardiograma(prev => ({
          ...prev,
          dataExame: us.dataExame || '',
          ...dados,
        }));
        break;
      case 'ultrassom_seguimento':
        setUsSeguimento(prev => ({
          ...prev,
          dataExame: us.dataExame || '',
          idadeGestacional: us.idadeGestacional || '',
          ...dados,
        }));
        break;
    }
  };

  // Função para limpar formulário e preparar para novo registro
  const prepararNovo = (tipoUltrassom: string) => {
    setEditingIds(prev => ({ ...prev, [tipoUltrassom]: null }));
    switch (tipoUltrassom) {
      case 'primeiro_ultrassom':
        setPrimeiroUS({ dataExame: '', idadeGestacional: '', ccn: '', bcf: '', sacoVitelino: '', hematoma: '', corpoLuteo: '', coloUterino: '', dpp: '' });
        break;
      case 'morfologico_1tri':
        setMorfo1Tri({ dataExame: '', idadeGestacional: '', tn: '', dv: '', valvaTricuspide: '', dopplerUterinas: '', incisuraPresente: '', colo: '', riscoTrissomias: '' });
        break;
      case 'ultrassom_obstetrico':
        setUsObstetrico({ dataExame: '', idadeGestacional: '', pesoFetal: '', placentaLocalizacao: '', placentaGrau: '', coloUterinoMedida: '' });
        break;
      case 'morfologico_2tri':
        setMorfo2Tri({ dataExame: '', idadeGestacional: '', biometria: '', pesoFetal: '', placentaLocalizacao: '', placentaGrau: '', liquidoAmniotico: '', coloUterino: '', avaliacaoAnatomica: '', dopplers: '', sexoFetal: '', observacoes: '' });
        break;
      case 'ecocardiograma_fetal':
        setEcocardiograma({ dataExame: '', conclusao: '' });
        break;
      case 'ultrassom_seguimento':
        setUsSeguimento({ dataExame: '', idadeGestacional: '', pesoFetal: '', percentilPeso: '', liquidoAmniotico: '', placentaLocalizacao: '', placentaGrau: '', coloUterino: '', movimentosFetais: '', apresentacaoFetal: '', dopplers: '', observacoes: '' });
        break;
    }
    limparDestaquesIA(tipoUltrassom);
  };

  useEffect(() => {
    if (ultrassons && ultrassons.length > 0) {
      // Para cada tipo, carregar o mais recente no formulário (apenas se não está editando)
      const tipos = ['primeiro_ultrassom', 'morfologico_1tri', 'ultrassom_obstetrico', 'morfologico_2tri', 'ecocardiograma_fetal', 'ultrassom_seguimento'];
      tipos.forEach(tipo => {
        const registros = ultrassons.filter((u: any) => u.tipoUltrassom === tipo);
        if (registros.length > 0 && !editingIds[tipo]) {
          // Carregar o mais recente
          const maisRecente = registros.sort((a: any, b: any) => (b.id || 0) - (a.id || 0))[0];
          carregarNoFormulario(maisRecente);
        }
      });
    }
  }, [ultrassons]);
  
  // Função para preencher dados extraídos pela IA
  const handleDadosExtraidos = (tipo: string, dados: Record<string, string>, arquivosProcessados: number = 1) => {
    // Normalizar datas antes de aplicar
    const dadosNormalizados = normalizeDadosDatas(dados);
    
    // Marcar campos que foram preenchidos pela IA para destaque visual
    const camposPreenchidos = new Set(Object.keys(dadosNormalizados).filter(key => dadosNormalizados[key] && dadosNormalizados[key].trim() !== ''));
    setCamposPreenchidosIA(prev => ({
      ...prev,
      [tipo]: camposPreenchidos,
    }));
    
    switch (tipo) {
      case 'primeiro_ultrassom':
        setPrimeiroUS(prev => ({ ...prev, ...dadosNormalizados }));
        break;
      case 'morfologico_1tri':
        setMorfo1Tri(prev => ({ ...prev, ...dadosNormalizados }));
        break;
      case 'ultrassom_obstetrico':
        setUsObstetrico(prev => ({ ...prev, ...dadosNormalizados }));
        break;
      case 'morfologico_2tri':
        setMorfo2Tri(prev => ({ ...prev, ...dadosNormalizados }));
        break;
      case 'ecocardiograma':
        setEcocardiograma(prev => ({ ...prev, ...dadosNormalizados }));
        break;
      case 'ultrassom_seguimento':
        setUsSeguimento(prev => ({ ...prev, ...dadosNormalizados }));
        break;
    }
    
    // Salvar no histórico de interpretações
    if (gestanteSelecionada) {
      salvarHistoricoMutation.mutate({
        gestanteId: gestanteSelecionada,
        tipoInterpretacao: 'ultrassom',
        tipoExame: tipo,
        arquivosProcessados,
        resultadoJson: dados,
      });
    }
    
    toast.success('✅ Dados extraídos com sucesso!', {
      description: 'Revise os campos preenchidos e clique em Salvar.',
      duration: 4000,
    });
  };

  // Função para validar campos obrigatórios
  const validarCamposObrigatorios = (tipoUltrassom: string, dados: any): { valido: boolean; mensagem?: string } => {
    const { dataExame, idadeGestacional } = dados;
    
    // Data do exame é obrigatória para todos os tipos
    if (!dataExame || dataExame.trim() === '') {
      return {
        valido: false,
        mensagem: 'Data do exame é obrigatória',
      };
    }
    
    // Idade gestacional é obrigatória para todos exceto ecocardiograma
    if (tipoUltrassom !== 'ecocardiograma_fetal') {
      if (!idadeGestacional || idadeGestacional.trim() === '') {
        return {
          valido: false,
          mensagem: 'Idade gestacional é obrigatória',
        };
      }
    }
    
    return { valido: true };
  };

  // Função para salvar ultrassom
  const handleSalvar = async (tipoUltrassom: string, dados: any) => {
    console.log('🔍 handleSalvar chamado:', { tipoUltrassom, dados, gestanteSelecionada });
    
    if (!gestanteSelecionada) {
      toast.error('⚠️ Gestante não selecionada', {
        description: 'Por favor, selecione uma gestante antes de salvar.',
        duration: 4000,
      });
      return;
    }
    
    // Validar campos obrigatórios
    const validacao = validarCamposObrigatorios(tipoUltrassom, dados);
    console.log('🔍 Resultado da validação:', validacao);
    
    if (!validacao.valido) {
      toast.error('❌ Campos obrigatórios não preenchidos', {
        description: validacao.mensagem,
        duration: 5000,
      });
      return;
    }
    
    const { dataExame, idadeGestacional, ...camposDados } = dados;
    
    const editingId = editingIds[tipoUltrassom];
    
    await salvarMutation.mutateAsync({
      ...(editingId ? { id: editingId } : {}),
      gestanteId: gestanteSelecionada,
      tipoUltrassom: tipoUltrassom as any,
      dataExame: dataExame || undefined,
      idadeGestacional: idadeGestacional || undefined,
      dados: camposDados,
    });
    
    // Após salvar, limpar o editingId (voltar para modo "novo")
    setEditingIds(prev => ({ ...prev, [tipoUltrassom]: null }));
  };
  
  // Filtrar gestantes pela busca
  const gestantesFiltradas = gestantes?.filter((g: any) =>
    g.nome.toLowerCase().includes(busca.toLowerCase())
  ) || [];
  
  if (loadingGestantes) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  return (
    <GestantesLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation('/')}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold mb-2">Ultrassons Pré-Natais</h1>
            <p className="text-muted-foreground">Registre os ultrassons realizados durante o pré-natal</p>
          </div>
          <Button
            onClick={() => setModalInterpretarAberto(true)}
            disabled={!gestanteSelecionada}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 ml-auto"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Interpretar com IA
          </Button>
        </div>
      
      {/* Seleção de Gestante */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Selecionar Gestante</CardTitle>
          <CardDescription>Busque e selecione a gestante para registrar ultrassons</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label>Buscar Gestante</Label>
              <Input
                placeholder="Digite o nome da gestante..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>
            
            {busca && gestantesFiltradas.length > 0 && (
              <div className="border rounded-md max-h-60 overflow-y-auto">
                {gestantesFiltradas.map((g: any) => (
                  <div
                    key={g.id}
                    className={`p-3 cursor-pointer hover:bg-accent ${gestanteSelecionada === g.id ? 'bg-accent' : ''}`}
                    onClick={() => {
                      setGestanteSelecionada(g.id);
                      setBusca(g.nome);
                    }}
                  >
                    <p className="font-medium">{g.nome}</p>
                    <p className="text-sm text-muted-foreground">
                      {g.idade ? `${g.idade} anos` : ''} {g.telefone ? `• ${g.telefone}` : ''}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {!gestanteSelecionada && (
        <div className="text-center py-12 text-muted-foreground">
          Selecione uma gestante para registrar ultrassons
        </div>
      )}
      
      {gestanteSelecionada && (
        <div className="space-y-8">
          {/* Histórico de Interpretações */}
          <HistoricoInterpretacoes gestanteId={gestanteSelecionada} tipo="ultrassom" />
          
          {/* 1º Ultrassom */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>1º Ultrassom</CardTitle>
                  <CardDescription>Ultrassom inicial de confirmação da gestação</CardDescription>
                </div>
                {lastSavedPrimeiroUS && gestanteSelecionada && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>Rascunho {lastSavedPrimeiroUS}</span>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Registros salvos - formulários completos */}
              {getUltrassonsPorTipo('primeiro_ultrassom').map((reg: any, idx: number) => (
                <UltrassomFormularioSalvo
                  key={reg.id}
                  registro={reg}
                  tipoUltrassom="primeiro_ultrassom"
                  tipoLabel="1º Ultrassom"
                  index={idx + 1}
                  fields={[
                    { key: 'dataExame', label: 'Data do Exame', type: 'date', required: true },
                    { key: 'idadeGestacional', label: 'Idade Gestacional', placeholder: 'Ex: 8s 3d', required: true },
                    { key: 'ccn', label: 'CCN (Comprimento Cabeça-Nádegas)', placeholder: 'Ex: 1.5 cm' },
                    { key: 'bcf', label: 'BCF (Batimento Cardíaco Fetal)', placeholder: 'Ex: 150 bpm' },
                    { key: 'sacoVitelino', label: 'Saco Vitelino', placeholder: 'Presente/Ausente' },
                    { key: 'hematoma', label: 'Presença de Hematoma/Coleções', placeholder: 'Sim/Não' },
                    { key: 'corpoLuteo', label: 'Identificação do Corpo Lúteo', placeholder: 'Presente/Ausente' },
                    { key: 'coloUterino', label: 'Colo Uterino', placeholder: 'Ex: 3.9 cm, OI fechado' },
                    { key: 'dpp', label: 'Data Provável do Parto (DPP)', type: 'date' },
                  ]}
                  onSalvar={handleSalvarRegistroSalvo}
                  onApagar={handleApagar}
                  isSaving={salvarMutation.isPending}
                  isDeleting={deletarMutation.isPending}
                />
              ))}
              {getUltrassonsPorTipo('primeiro_ultrassom').length > 0 && <Separator className="my-4" />}
              <p className="text-sm font-medium text-muted-foreground">Novo 1º Ultrassom</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Data do Exame <span className="text-red-500">*</span></Label>
                  <Input
                    type="date"
                    className={getInputClassName('primeiro_ultrassom', 'dataExame')}
                    value={primeiroUS.dataExame}
                    onChange={(e) => { removerDestaqueIA('primeiro_ultrassom', 'dataExame'); setPrimeiroUS({ ...primeiroUS, dataExame: e.target.value }); }}
                  />
                </div>
                <div>
                  <Label>Idade Gestacional <span className="text-red-500">*</span></Label>
                  <Input
                    placeholder="Ex: 7s 2d"
                    className={getInputClassName('primeiro_ultrassom', 'idadeGestacional')}
                    value={primeiroUS.idadeGestacional}
                    onChange={(e) => { removerDestaqueIA('primeiro_ultrassom', 'idadeGestacional'); setPrimeiroUS({ ...primeiroUS, idadeGestacional: e.target.value }); }}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>CCN (Comprimento Cabeça-Nádegas)</Label>
                  <Input
                    placeholder="Ex: 12mm"
                    className={getInputClassName('primeiro_ultrassom', 'ccn')}
                    value={primeiroUS.ccn}
                    onChange={(e) => { removerDestaqueIA('primeiro_ultrassom', 'ccn'); setPrimeiroUS({ ...primeiroUS, ccn: e.target.value }); }}
                  />
                </div>
                <div>
                  <Label>BCF (Batimento Cardíaco Fetal)</Label>
                  <Input
                    placeholder="Ex: 150 bpm"
                    className={getInputClassName('primeiro_ultrassom', 'bcf')}
                    value={primeiroUS.bcf}
                    onChange={(e) => { removerDestaqueIA('primeiro_ultrassom', 'bcf'); setPrimeiroUS({ ...primeiroUS, bcf: e.target.value }); }}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Saco Vitelino</Label>
                  <Input
                    placeholder="Presente/Ausente"
                    className={getInputClassName('primeiro_ultrassom', 'sacoVitelino')}
                    value={primeiroUS.sacoVitelino}
                    onChange={(e) => { removerDestaqueIA('primeiro_ultrassom', 'sacoVitelino'); setPrimeiroUS({ ...primeiroUS, sacoVitelino: e.target.value }); }}
                  />
                </div>
                <div>
                  <Label>Presença de Hematoma/Coleções</Label>
                  <Input
                    placeholder="Sim/Não"
                    className={getInputClassName('primeiro_ultrassom', 'hematoma')}
                    value={primeiroUS.hematoma}
                    onChange={(e) => { removerDestaqueIA('primeiro_ultrassom', 'hematoma'); setPrimeiroUS({ ...primeiroUS, hematoma: e.target.value }); }}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Identificação do Corpo Lúteo</Label>
                  <Input
                    placeholder="Presente/Ausente"
                    className={getInputClassName('primeiro_ultrassom', 'corpoLuteo')}
                    value={primeiroUS.corpoLuteo}
                    onChange={(e) => { removerDestaqueIA('primeiro_ultrassom', 'corpoLuteo'); setPrimeiroUS({ ...primeiroUS, corpoLuteo: e.target.value }); }}
                  />
                </div>
                <div>
                  <Label>Colo Uterino</Label>
                  <Input
                    placeholder="Ex: 3.9 cm, OI fechado"
                    className={getInputClassName('primeiro_ultrassom', 'coloUterino')}
                    value={primeiroUS.coloUterino}
                    onChange={(e) => { removerDestaqueIA('primeiro_ultrassom', 'coloUterino'); setPrimeiroUS({ ...primeiroUS, coloUterino: e.target.value }); }}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Data Provável do Parto (DPP)</Label>
                  <Input
                    type="date"
                    className={getInputClassName('primeiro_ultrassom', 'dpp')}
                    value={primeiroUS.dpp}
                    onChange={(e) => { removerDestaqueIA('primeiro_ultrassom', 'dpp'); setPrimeiroUS({ ...primeiroUS, dpp: e.target.value }); }}
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Button onClick={() => handleSalvar('primeiro_ultrassom', primeiroUS)} disabled={salvarMutation.isPending}>
                  {salvarMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  {salvarMutation.isPending ? 'Salvando...' : editingIds.primeiro_ultrassom ? 'Atualizar 1º Ultrassom' : 'Salvar Novo 1º Ultrassom'}
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Morfológico 1º Trimestre */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Morfológico 1º Trimestre</CardTitle>
                  <CardDescription>Ultrassom morfológico com avaliação de translucência nucal</CardDescription>
                </div>
                {lastSavedMorfo1Tri && gestanteSelecionada && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>Rascunho {lastSavedMorfo1Tri}</span>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Registros salvos - formulários completos */}
              {getUltrassonsPorTipo('morfologico_1tri').map((reg: any, idx: number) => (
                <UltrassomFormularioSalvo
                  key={reg.id}
                  registro={reg}
                  tipoUltrassom="morfologico_1tri"
                  tipoLabel="Morfológico 1º Tri"
                  index={idx + 1}
                  fields={[
                    { key: 'dataExame', label: 'Data do Exame', type: 'date', required: true },
                    { key: 'idadeGestacional', label: 'Idade Gestacional', placeholder: 'Ex: 12s 3d', required: true },
                    { key: 'tn', label: 'Translucência Nucal (TN)', placeholder: 'Ex: 1.5 mm' },
                    { key: 'dv', label: 'Ducto Venoso (DV)', placeholder: 'Ex: Onda A positiva' },
                    { key: 'valvaTricuspide', label: 'Valva Tricúspide', placeholder: 'Normal/Regurgitação' },
                    { key: 'dopplerUterinas', label: 'Doppler de Uterinas', placeholder: 'Ex: IP médio 1.2' },
                    { key: 'incisuraPresente', label: 'Incisura Presente', placeholder: 'Sim/Não' },
                    { key: 'colo', label: 'Colo Uterino', placeholder: 'Ex: 35 mm' },
                    { key: 'riscoTrissomias', label: 'Risco de Trissomias', placeholder: 'Ex: Baixo risco', colSpan: 3, type: 'textarea', rows: 2 },
                  ]}
                  onSalvar={handleSalvarRegistroSalvo}
                  onApagar={handleApagar}
                  isSaving={salvarMutation.isPending}
                  isDeleting={deletarMutation.isPending}
                />
              ))}
              {getUltrassonsPorTipo('morfologico_1tri').length > 0 && <Separator className="my-4" />}
              <p className="text-sm font-medium text-muted-foreground">Novo Morfológico 1º Tri</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Data do Exame <span className="text-red-500">*</span></Label>
                  <Input
                    type="date"
                    className={getInputClassName('morfologico_1tri', 'dataExame')}
                    value={morfo1Tri.dataExame}
                    onChange={(e) => { removerDestaqueIA('morfologico_1tri', 'dataExame'); setMorfo1Tri({ ...morfo1Tri, dataExame: e.target.value }); }}
                  />
                </div>
                <div>
                  <Label>Idade Gestacional <span className="text-red-500">*</span></Label>
                  <Input
                    placeholder="Ex: 12s 3d"
                    className={getInputClassName('morfologico_1tri', 'idadeGestacional')}
                    value={morfo1Tri.idadeGestacional}
                    onChange={(e) => { removerDestaqueIA('morfologico_1tri', 'idadeGestacional'); setMorfo1Tri({ ...morfo1Tri, idadeGestacional: e.target.value }); }}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Translucência Nucal (TN)</Label>
                  <Input
                    placeholder="Ex: 1.2mm"
                    className={getInputClassName('morfologico_1tri', 'tn')}
                    value={morfo1Tri.tn}
                    onChange={(e) => { removerDestaqueIA('morfologico_1tri', 'tn'); setMorfo1Tri({ ...morfo1Tri, tn: e.target.value }); }}
                  />
                </div>
                <div>
                  <Label>Ducto Venoso (DV)</Label>
                  <Input
                    placeholder="Normal/Alterado"
                    className={getInputClassName('morfologico_1tri', 'dv')}
                    value={morfo1Tri.dv}
                    onChange={(e) => { removerDestaqueIA('morfologico_1tri', 'dv'); setMorfo1Tri({ ...morfo1Tri, dv: e.target.value }); }}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Valva Tricúspide</Label>
                  <Input
                    placeholder="Normal/Alterada"
                    className={getInputClassName('morfologico_1tri', 'valvaTricuspide')}
                    value={morfo1Tri.valvaTricuspide}
                    onChange={(e) => { removerDestaqueIA('morfologico_1tri', 'valvaTricuspide'); setMorfo1Tri({ ...morfo1Tri, valvaTricuspide: e.target.value }); }}
                  />
                </div>
                <div>
                  <Label>Doppler das Artérias Uterinas</Label>
                  <Input
                    placeholder="Valor dos IPs"
                    className={getInputClassName('morfologico_1tri', 'dopplerUterinas')}
                    value={morfo1Tri.dopplerUterinas}
                    onChange={(e) => { removerDestaqueIA('morfologico_1tri', 'dopplerUterinas'); setMorfo1Tri({ ...morfo1Tri, dopplerUterinas: e.target.value }); }}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Incisura Presente?</Label>
                  <Input
                    placeholder="Sim/Não"
                    className={getInputClassName('morfologico_1tri', 'incisuraPresente')}
                    value={morfo1Tri.incisuraPresente}
                    onChange={(e) => { removerDestaqueIA('morfologico_1tri', 'incisuraPresente'); setMorfo1Tri({ ...morfo1Tri, incisuraPresente: e.target.value }); }}
                  />
                </div>
                <div>
                  <Label>Medida do Colo Uterino</Label>
                  <Input
                    placeholder="Ex: 35mm"
                    className={getInputClassName('morfologico_1tri', 'colo')}
                    value={morfo1Tri.colo}
                    onChange={(e) => { removerDestaqueIA('morfologico_1tri', 'colo'); setMorfo1Tri({ ...morfo1Tri, colo: e.target.value }); }}
                  />
                </div>
              </div>
              
              <div>
                <Label>Risco Calculado para Trissomias</Label>
                <Input
                  placeholder="Ex: Baixo risco"
                  className={getInputClassName('morfologico_1tri', 'riscoTrissomias')}
                  value={morfo1Tri.riscoTrissomias}
                  onChange={(e) => { removerDestaqueIA('morfologico_1tri', 'riscoTrissomias'); setMorfo1Tri({ ...morfo1Tri, riscoTrissomias: e.target.value }); }}
                />
              </div>
              
              <div className="flex items-center gap-3">
                <Button onClick={() => handleSalvar('morfologico_1tri', morfo1Tri)} disabled={salvarMutation.isPending}>
                  {salvarMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  {salvarMutation.isPending ? 'Salvando...' : editingIds.morfologico_1tri ? 'Atualizar Morfológico 1º Tri' : 'Salvar Novo Morfológico 1º Tri'}
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Ultrassom Obstétrico */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Ultrassom Obstétrico</CardTitle>
                  <CardDescription>Ultrassom de rotina para acompanhamento</CardDescription>
                </div>
                {lastSavedUsObstetrico && gestanteSelecionada && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>Rascunho {lastSavedUsObstetrico}</span>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Registros salvos - formulários completos */}
              {getUltrassonsPorTipo('ultrassom_obstetrico').map((reg: any, idx: number) => (
                <UltrassomFormularioSalvo
                  key={reg.id}
                  registro={reg}
                  tipoUltrassom="ultrassom_obstetrico"
                  tipoLabel="US Obstétrico"
                  index={idx + 1}
                  fields={[
                    { key: 'dataExame', label: 'Data do Exame', type: 'date', required: true },
                    { key: 'idadeGestacional', label: 'Idade Gestacional', placeholder: 'Ex: 20s 1d', required: true },
                    { key: 'pesoFetal', label: 'Peso Fetal Estimado', placeholder: 'Ex: 350g', colSpan: 3 },
                    { key: 'placentaLocalizacao', label: 'Placenta - Localização', placeholder: 'Ex: Anterior' },
                    { key: 'placentaGrau', label: 'Placenta - Grau', placeholder: 'Ex: 0' },
                    { key: 'coloUterinoMedida', label: 'Colo Uterino', placeholder: 'Ex: 28.8 mm' },
                  ]}
                  onSalvar={handleSalvarRegistroSalvo}
                  onApagar={handleApagar}
                  isSaving={salvarMutation.isPending}
                  isDeleting={deletarMutation.isPending}
                />
              ))}
              {getUltrassonsPorTipo('ultrassom_obstetrico').length > 0 && <Separator className="my-4" />}
              <p className="text-sm font-medium text-muted-foreground">Novo US Obstétrico</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Data do Exame <span className="text-red-500">*</span></Label>
                  <Input
                    type="date"
                    className={getInputClassName('ultrassom_obstetrico', 'dataExame')}
                    value={usObstetrico.dataExame}
                    onChange={(e) => { removerDestaqueIA('ultrassom_obstetrico', 'dataExame'); setUsObstetrico({ ...usObstetrico, dataExame: e.target.value }); }}
                  />
                </div>
                <div>
                  <Label>Idade Gestacional <span className="text-red-500">*</span></Label>
                  <Input
                    placeholder="Ex: 20s 1d"
                    className={getInputClassName('ultrassom_obstetrico', 'idadeGestacional')}
                    value={usObstetrico.idadeGestacional}
                    onChange={(e) => { removerDestaqueIA('ultrassom_obstetrico', 'idadeGestacional'); setUsObstetrico({ ...usObstetrico, idadeGestacional: e.target.value }); }}
                  />
                </div>
              </div>
              
              <div>
                <Label>Peso Fetal Estimado</Label>
                <Input
                  placeholder="Ex: 350g"
                  className={getInputClassName('ultrassom_obstetrico', 'pesoFetal')}
                  value={usObstetrico.pesoFetal}
                  onChange={(e) => { removerDestaqueIA('ultrassom_obstetrico', 'pesoFetal'); setUsObstetrico({ ...usObstetrico, pesoFetal: e.target.value }); }}
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Placenta - Localização</Label>
                  <Input
                    placeholder="Ex: Anterior"
                    className={getInputClassName('ultrassom_obstetrico', 'placentaLocalizacao')}
                    value={usObstetrico.placentaLocalizacao}
                    onChange={(e) => { removerDestaqueIA('ultrassom_obstetrico', 'placentaLocalizacao'); setUsObstetrico({ ...usObstetrico, placentaLocalizacao: e.target.value }); }}
                  />
                </div>
                <div>
                  <Label>Placenta - Grau</Label>
                  <Input
                    placeholder="Ex: 0, I, II, III"
                    className={getInputClassName('ultrassom_obstetrico', 'placentaGrau')}
                    value={usObstetrico.placentaGrau}
                    onChange={(e) => { removerDestaqueIA('ultrassom_obstetrico', 'placentaGrau'); setUsObstetrico({ ...usObstetrico, placentaGrau: e.target.value }); }}
                  />
                </div>

              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Colo Uterino</Label>
                  <Input
                    placeholder="Ex: 35 mm, OI fechado"
                    className={getInputClassName('ultrassom_obstetrico', 'coloUterinoMedida')}
                    value={usObstetrico.coloUterinoMedida}
                    onChange={(e) => { removerDestaqueIA('ultrassom_obstetrico', 'coloUterinoMedida'); setUsObstetrico({ ...usObstetrico, coloUterinoMedida: e.target.value }); }}
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Button onClick={() => handleSalvar('ultrassom_obstetrico', usObstetrico)} disabled={salvarMutation.isPending}>
                  {salvarMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  {salvarMutation.isPending ? 'Salvando...' : editingIds.ultrassom_obstetrico ? 'Atualizar US Obstétrico' : 'Salvar Novo US Obstétrico'}
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Morfológico 2º Trimestre */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Morfológico 2º Trimestre</CardTitle>
                  <CardDescription>Ultrassom morfológico detalhado com avaliação anatômica</CardDescription>
                </div>
                {lastSavedMorfo2Tri && gestanteSelecionada && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>Rascunho {lastSavedMorfo2Tri}</span>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Registros salvos - formulários completos */}
              {getUltrassonsPorTipo('morfologico_2tri').map((reg: any, idx: number) => (
                <UltrassomFormularioSalvo
                  key={reg.id}
                  registro={reg}
                  tipoUltrassom="morfologico_2tri"
                  tipoLabel="Morfológico 2º Tri"
                  index={idx + 1}
                  fields={[
                    { key: 'dataExame', label: 'Data do Exame', type: 'date', required: true },
                    { key: 'idadeGestacional', label: 'Idade Gestacional', placeholder: 'Ex: 22s 0d', required: true },
                    { key: 'biometria', label: 'Biometria Fetal', placeholder: 'DBP, CC, CA, CF...', colSpan: 3 },
                    { key: 'pesoFetal', label: 'Peso Fetal Estimado', placeholder: 'Ex: 500g' },
                    { key: 'sexoFetal', label: 'Sexo Fetal', placeholder: 'Masculino/Feminino' },
                    { key: 'placentaLocalizacao', label: 'Placenta - Localização', placeholder: 'Ex: Posterior' },
                    { key: 'placentaGrau', label: 'Placenta - Grau', placeholder: 'Ex: 0' },
                    { key: 'liquidoAmniotico', label: 'Líquido Amniótico', placeholder: 'Ex: Normal' },
                    { key: 'coloUterino', label: 'Colo Uterino', placeholder: 'Ex: 35 mm' },
                    { key: 'avaliacaoAnatomica', label: 'Avaliação Anatômica', placeholder: 'Detalhes da avaliação...', colSpan: 3, type: 'textarea', rows: 3 },
                    { key: 'dopplers', label: 'Dopplers', placeholder: 'Valores dos dopplers...', colSpan: 3 },
                    { key: 'observacoes', label: 'Observações', placeholder: 'Observações adicionais...', colSpan: 3, type: 'textarea', rows: 3 },
                  ]}
                  onSalvar={handleSalvarRegistroSalvo}
                  onApagar={handleApagar}
                  isSaving={salvarMutation.isPending}
                  isDeleting={deletarMutation.isPending}
                />
              ))}
              {getUltrassonsPorTipo('morfologico_2tri').length > 0 && <Separator className="my-4" />}
              <p className="text-sm font-medium text-muted-foreground">Novo Morfológico 2º Tri</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Data do Exame <span className="text-red-500">*</span></Label>
                  <Input
                    type="date"
                    className={getInputClassName('morfologico_2tri', 'dataExame')}
                    value={morfo2Tri.dataExame}
                    onChange={(e) => { removerDestaqueIA('morfologico_2tri', 'dataExame'); setMorfo2Tri({ ...morfo2Tri, dataExame: e.target.value }); }}
                  />
                </div>
                <div>
                  <Label>Idade Gestacional <span className="text-red-500">*</span></Label>
                  <Input
                    placeholder="Ex: 22s 4d"
                    className={getInputClassName('morfologico_2tri', 'idadeGestacional')}
                    value={morfo2Tri.idadeGestacional}
                    onChange={(e) => { removerDestaqueIA('morfologico_2tri', 'idadeGestacional'); setMorfo2Tri({ ...morfo2Tri, idadeGestacional: e.target.value }); }}
                  />
                </div>
              </div>
              
              <div>
                <Label>Biometria Completa</Label>
                <TextareaComAutocomplete
                  placeholder="DBP, CC, CA, CF..."
                  className={getInputClassName('morfologico_2tri', 'biometria')}
                  value={morfo2Tri.biometria}
                  onChange={(val) => { removerDestaqueIA('morfologico_2tri', 'biometria'); setMorfo2Tri({ ...morfo2Tri, biometria: val }); }}
                  tipo="us_biometria"
                  rows={3}
                />
              </div>
              
              <div>
                <Label>Peso Fetal Estimado</Label>
                <Input
                  placeholder="Ex: 450g"
                  className={getInputClassName('morfologico_2tri', 'pesoFetal')}
                  value={morfo2Tri.pesoFetal}
                  onChange={(e) => { removerDestaqueIA('morfologico_2tri', 'pesoFetal'); setMorfo2Tri({ ...morfo2Tri, pesoFetal: e.target.value }); }}
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Placenta - Localização</Label>
                  <Input
                    placeholder="Ex: Anterior"
                    className={getInputClassName('morfologico_2tri', 'placentaLocalizacao')}
                    value={morfo2Tri.placentaLocalizacao}
                    onChange={(e) => { removerDestaqueIA('morfologico_2tri', 'placentaLocalizacao'); setMorfo2Tri({ ...morfo2Tri, placentaLocalizacao: e.target.value }); }}
                  />
                </div>
                <div>
                  <Label>Placenta - Grau</Label>
                  <Input
                    placeholder="Ex: 0, I, II, III"
                    className={getInputClassName('morfologico_2tri', 'placentaGrau')}
                    value={morfo2Tri.placentaGrau}
                    onChange={(e) => { removerDestaqueIA('morfologico_2tri', 'placentaGrau'); setMorfo2Tri({ ...morfo2Tri, placentaGrau: e.target.value }); }}
                  />
                </div>
                <div>
                  <Label>Colo Uterino</Label>
                  <Input
                    placeholder="Ex: 35 mm, OI fechado"
                    className={getInputClassName('morfologico_2tri', 'coloUterino')}
                    value={morfo2Tri.coloUterino || ''}
                    onChange={(e) => { removerDestaqueIA('morfologico_2tri', 'coloUterino'); setMorfo2Tri({ ...morfo2Tri, coloUterino: e.target.value }); }}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Líquido Amniótico (ILA)</Label>
                  <Input
                    placeholder="Ex: 12cm"
                    className={getInputClassName('morfologico_2tri', 'liquidoAmniotico')}
                    value={morfo2Tri.liquidoAmniotico}
                    onChange={(e) => { removerDestaqueIA('morfologico_2tri', 'liquidoAmniotico'); setMorfo2Tri({ ...morfo2Tri, liquidoAmniotico: e.target.value }); }}
                  />
                </div>
              </div>
              
              <div>
                <Label>Avaliação Anatômica Detalhada</Label>
                <TextareaComAutocomplete
                  placeholder="Crânio, face, coluna, tórax, coração, abdome, membros..."
                  className={getInputClassName('morfologico_2tri', 'avaliacaoAnatomica')}
                  value={morfo2Tri.avaliacaoAnatomica}
                  onChange={(val) => { removerDestaqueIA('morfologico_2tri', 'avaliacaoAnatomica'); setMorfo2Tri({ ...morfo2Tri, avaliacaoAnatomica: val }); }}
                  tipo="us_avaliacao_anatomica"
                  rows={4}
                />
              </div>
              
              <div>
                <Label>Dopplers (se realizados)</Label>
                <Input
                  placeholder="AU, ACM, DV..."
                  className={getInputClassName('morfologico_2tri', 'dopplers')}
                  value={morfo2Tri.dopplers}
                  onChange={(e) => { removerDestaqueIA('morfologico_2tri', 'dopplers'); setMorfo2Tri({ ...morfo2Tri, dopplers: e.target.value }); }}
                />
              </div>
              
              <div>
                <Label>Sexo Fetal (se desejado)</Label>
                <Input
                  placeholder="Masculino/Feminino"
                  className={getInputClassName('morfologico_2tri', 'sexoFetal')}
                  value={morfo2Tri.sexoFetal}
                  onChange={(e) => { removerDestaqueIA('morfologico_2tri', 'sexoFetal'); setMorfo2Tri({ ...morfo2Tri, sexoFetal: e.target.value }); }}
                />
              </div>
              
              <div>
                <Label>Observações</Label>
                <TextareaComAutocomplete
                  placeholder="Observações adicionais..."
                  className={getInputClassName('morfologico_2tri', 'observacoes')}
                  value={morfo2Tri.observacoes}
                  onChange={(val) => { removerDestaqueIA('morfologico_2tri', 'observacoes'); setMorfo2Tri({ ...morfo2Tri, observacoes: val }); }}
                  tipo="us_observacoes"
                  rows={3}
                />
              </div>
              
              <div className="flex items-center gap-3">
                <Button onClick={() => handleSalvar('morfologico_2tri', morfo2Tri)} disabled={salvarMutation.isPending}>
                  {salvarMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  {salvarMutation.isPending ? 'Salvando...' : editingIds.morfologico_2tri ? 'Atualizar Morfológico 2º Tri' : 'Salvar Novo Morfológico 2º Tri'}
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Ecocardiograma Fetal */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Ecocardiograma Fetal</CardTitle>
                  <CardDescription>Avaliação especializada do coração fetal</CardDescription>
                </div>
                {lastSavedEcocardiograma && gestanteSelecionada && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>Rascunho {lastSavedEcocardiograma}</span>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Registros salvos - formulários completos */}
              {getUltrassonsPorTipo('ecocardiograma_fetal').map((reg: any, idx: number) => (
                <UltrassomFormularioSalvo
                  key={reg.id}
                  registro={reg}
                  tipoUltrassom="ecocardiograma_fetal"
                  tipoLabel="Ecocardiograma"
                  index={idx + 1}
                  fields={[
                    { key: 'dataExame', label: 'Data do Exame', type: 'date', required: true },
                    { key: 'conclusao', label: 'Conclusão', placeholder: 'Conclusão do ecocardiograma fetal...', type: 'textarea', rows: 5, colSpan: 3, autocompleteType: 'eco_conclusao' },
                  ]}
                  onSalvar={handleSalvarRegistroSalvo}
                  onApagar={handleApagar}
                  isSaving={salvarMutation.isPending}
                  isDeleting={deletarMutation.isPending}
                />
              ))}
              {getUltrassonsPorTipo('ecocardiograma_fetal').length > 0 && <Separator className="my-4" />}
              <p className="text-sm font-medium text-muted-foreground">Novo Ecocardiograma</p>
              <div>
                <Label>Data do Exame <span className="text-red-500">*</span></Label>
                <Input
                  type="date"
                  className={getInputClassName('ecocardiograma', 'dataExame')}
                  value={ecocardiograma.dataExame}
                  onChange={(e) => { removerDestaqueIA('ecocardiograma', 'dataExame'); setEcocardiograma({ ...ecocardiograma, dataExame: e.target.value }); }}
                />
              </div>
              
              <div>
                <Label>Conclusão</Label>
                <TextareaComAutocomplete
                  placeholder="Conclusão do ecocardiograma fetal..."
                  className={getInputClassName('ecocardiograma', 'conclusao')}
                  value={ecocardiograma.conclusao}
                  onChange={(val) => { removerDestaqueIA('ecocardiograma', 'conclusao'); setEcocardiograma({ ...ecocardiograma, conclusao: val }); }}
                  tipo="eco_conclusao"
                  rows={5}
                />
              </div>
              
              <div className="flex items-center gap-3">
                <Button onClick={() => handleSalvar('ecocardiograma_fetal', ecocardiograma)} disabled={salvarMutation.isPending}>
                  {salvarMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  {salvarMutation.isPending ? 'Salvando...' : editingIds.ecocardiograma_fetal ? 'Atualizar Ecocardiograma' : 'Salvar Novo Ecocardiograma'}
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Ultrassons de Seguimento */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Ultrassons de Seguimento</CardTitle>
                  <CardDescription>Ultrassons de acompanhamento após morfológico 2º trimestre (3 a 5 exames)</CardDescription>
                </div>
                {lastSavedUsSeguimento && gestanteSelecionada && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>Rascunho {lastSavedUsSeguimento}</span>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Registros salvos - formulários completos */}
              {getUltrassonsPorTipo('ultrassom_seguimento').map((reg: any, idx: number) => (
                <UltrassomFormularioSalvo
                  key={reg.id}
                  registro={reg}
                  tipoUltrassom="ultrassom_seguimento"
                  tipoLabel="US Seguimento"
                  index={idx + 1}
                  fields={[
                    { key: 'dataExame', label: 'Data do Exame', type: 'date', required: true },
                    { key: 'idadeGestacional', label: 'Idade Gestacional', placeholder: 'Ex: 32s 1d', required: true },
                    { key: 'pesoFetal', label: 'Peso Fetal Estimado', placeholder: 'Ex: 2100g' },
                    { key: 'percentilPeso', label: 'Percentil do Peso Fetal', placeholder: 'Ex: P50' },
                    { key: 'liquidoAmniotico', label: 'Líquido Amniótico (ILA ou subjetivo)', placeholder: 'Ex: 10cm ou Normal', colSpan: 3 },
                    { key: 'placentaLocalizacao', label: 'Placenta - Localização', placeholder: 'Ex: Anterior' },
                    { key: 'placentaGrau', label: 'Placenta - Grau', placeholder: 'Ex: II' },
                    { key: 'coloUterino', label: 'Colo Uterino', placeholder: 'Ex: 35 mm, OI fechado' },
                    { key: 'movimentosFetais', label: 'Movimentos Fetais', placeholder: 'Presentes/Ausentes' },
                    { key: 'apresentacaoFetal', label: 'Apresentação Fetal', placeholder: 'Cefálica/Pélvica/Transversa' },
                    { key: 'dopplers', label: 'Dopplers (AU, ACM, DV se indicado)', placeholder: 'Valores dos dopplers...', colSpan: 3 },
                    { key: 'observacoes', label: 'Observações', placeholder: 'Observações adicionais...', colSpan: 3, type: 'textarea', rows: 3, autocompleteType: 'us_seguimento_observacoes' },
                  ]}
                  onSalvar={handleSalvarRegistroSalvo}
                  onApagar={handleApagar}
                  isSaving={salvarMutation.isPending}
                  isDeleting={deletarMutation.isPending}
                />
              ))}
              {getUltrassonsPorTipo('ultrassom_seguimento').length > 0 && <Separator className="my-4" />}
              <p className="text-sm font-medium text-muted-foreground">Novo US Seguimento</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Data do Exame <span className="text-red-500">*</span></Label>
                  <Input
                    type="date"
                    className={getInputClassName('ultrassom_seguimento', 'dataExame')}
                    value={usSeguimento.dataExame}
                    onChange={(e) => { removerDestaqueIA('ultrassom_seguimento', 'dataExame'); setUsSeguimento({ ...usSeguimento, dataExame: e.target.value }); }}
                  />
                </div>
                <div>
                  <Label>Idade Gestacional <span className="text-red-500">*</span></Label>
                  <Input
                    placeholder="Ex: 32s 1d"
                    className={getInputClassName('ultrassom_seguimento', 'idadeGestacional')}
                    value={usSeguimento.idadeGestacional}
                    onChange={(e) => { removerDestaqueIA('ultrassom_seguimento', 'idadeGestacional'); setUsSeguimento({ ...usSeguimento, idadeGestacional: e.target.value }); }}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Peso Fetal Estimado</Label>
                  <Input
                    placeholder="Ex: 2100g"
                    className={getInputClassName('ultrassom_seguimento', 'pesoFetal')}
                    value={usSeguimento.pesoFetal}
                    onChange={(e) => { removerDestaqueIA('ultrassom_seguimento', 'pesoFetal'); setUsSeguimento({ ...usSeguimento, pesoFetal: e.target.value }); }}
                  />
                </div>
                <div>
                  <Label>Percentil do Peso Fetal</Label>
                  <Input
                    placeholder="Ex: P50"
                    className={getInputClassName('ultrassom_seguimento', 'percentilPeso')}
                    value={usSeguimento.percentilPeso}
                    onChange={(e) => { removerDestaqueIA('ultrassom_seguimento', 'percentilPeso'); setUsSeguimento({ ...usSeguimento, percentilPeso: e.target.value }); }}
                  />
                </div>
              </div>
              
              <div>
                <Label>Líquido Amniótico (ILA ou subjetivo)</Label>
                <Input
                  placeholder="Ex: 10cm ou Normal"
                  className={getInputClassName('ultrassom_seguimento', 'liquidoAmniotico')}
                  value={usSeguimento.liquidoAmniotico}
                  onChange={(e) => { removerDestaqueIA('ultrassom_seguimento', 'liquidoAmniotico'); setUsSeguimento({ ...usSeguimento, liquidoAmniotico: e.target.value }); }}
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Placenta - Localização</Label>
                  <Input
                    placeholder="Ex: Anterior"
                    className={getInputClassName('ultrassom_seguimento', 'placentaLocalizacao')}
                    value={usSeguimento.placentaLocalizacao}
                    onChange={(e) => { removerDestaqueIA('ultrassom_seguimento', 'placentaLocalizacao'); setUsSeguimento({ ...usSeguimento, placentaLocalizacao: e.target.value }); }}
                  />
                </div>
                <div>
                  <Label>Placenta - Grau</Label>
                  <Input
                    placeholder="Ex: II"
                    className={getInputClassName('ultrassom_seguimento', 'placentaGrau')}
                    value={usSeguimento.placentaGrau}
                    onChange={(e) => { removerDestaqueIA('ultrassom_seguimento', 'placentaGrau'); setUsSeguimento({ ...usSeguimento, placentaGrau: e.target.value }); }}
                  />
                </div>
                <div>
                  <Label>Colo Uterino</Label>
                  <Input
                    placeholder="Ex: 35 mm, OI fechado"
                    className={getInputClassName('ultrassom_seguimento', 'coloUterino')}
                    value={usSeguimento.coloUterino || ''}
                    onChange={(e) => { removerDestaqueIA('ultrassom_seguimento', 'coloUterino'); setUsSeguimento({ ...usSeguimento, coloUterino: e.target.value }); }}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Movimentos Fetais</Label>
                  <Input
                    placeholder="Presentes/Ausentes"
                    className={getInputClassName('ultrassom_seguimento', 'movimentosFetais')}
                    value={usSeguimento.movimentosFetais}
                    onChange={(e) => { removerDestaqueIA('ultrassom_seguimento', 'movimentosFetais'); setUsSeguimento({ ...usSeguimento, movimentosFetais: e.target.value }); }}
                  />
                </div>
                <div>
                  <Label>Apresentação Fetal</Label>
                  <Input
                    placeholder="Cefálica/Pélvica/Transversa"
                    className={getInputClassName('ultrassom_seguimento', 'apresentacaoFetal')}
                    value={usSeguimento.apresentacaoFetal}
                    onChange={(e) => { removerDestaqueIA('ultrassom_seguimento', 'apresentacaoFetal'); setUsSeguimento({ ...usSeguimento, apresentacaoFetal: e.target.value }); }}
                  />
                </div>
              </div>
              
              <div>
                <Label>Dopplers (AU, ACM, DV se indicado)</Label>
                <Input
                  placeholder="Valores dos dopplers..."
                  className={getInputClassName('ultrassom_seguimento', 'dopplers')}
                  value={usSeguimento.dopplers}
                  onChange={(e) => { removerDestaqueIA('ultrassom_seguimento', 'dopplers'); setUsSeguimento({ ...usSeguimento, dopplers: e.target.value }); }}
                />
              </div>
              
              <div>
                <Label>Observações</Label>
                <TextareaComAutocomplete
                  placeholder="Observações adicionais..."
                  className={getInputClassName('ultrassom_seguimento', 'observacoes')}
                  value={usSeguimento.observacoes}
                  onChange={(val) => { removerDestaqueIA('ultrassom_seguimento', 'observacoes'); setUsSeguimento({ ...usSeguimento, observacoes: val }); }}
                  tipo="us_seguimento_observacoes"
                  rows={3}
                />
              </div>
              
              <div className="flex items-center gap-3">
                <Button onClick={() => handleSalvar('ultrassom_seguimento', usSeguimento)} disabled={salvarMutation.isPending}>
                  {salvarMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  {salvarMutation.isPending ? 'Salvando...' : editingIds.ultrassom_seguimento ? 'Atualizar US Seguimento' : 'Salvar Novo US Seguimento'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de Interpretação com IA */}
      <InterpretarUltrassomModal
        open={modalInterpretarAberto}
        onClose={() => setModalInterpretarAberto(false)}
        onDadosExtraidos={handleDadosExtraidos}
        nomeGestante={gestanteAtiva?.nome || busca}
      />
      </div>
    </GestantesLayout>
  );
}
