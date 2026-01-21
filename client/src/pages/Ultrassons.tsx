import React, { useState, useEffect } from "react";
import { trpc } from '@/lib/trpc';
import GestantesLayout from '@/components/GestantesLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Loader2, Save, ArrowLeft, Sparkles, Check } from 'lucide-react';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useInstantSave } from '@/hooks/useInstantSave';
import { toast } from 'sonner';
import { useLocation } from 'wouter';
import { useGestanteAtiva } from '@/contexts/GestanteAtivaContext';
import { InterpretarUltrassomModal } from '@/components/InterpretarUltrassomModal';
import { HistoricoInterpretacoes } from '@/components/HistoricoInterpretacoes';


export default function Ultrassons() {
  const [, setLocation] = useLocation();
  const { gestanteAtiva } = useGestanteAtiva();
  const [gestanteSelecionada, setGestanteSelecionada] = useState<number | null>(gestanteAtiva?.id || null);
  
  // Atualizar gestante selecionada quando gestante ativa mudar
  React.useEffect(() => {
    if (gestanteAtiva) {
      setGestanteSelecionada(gestanteAtiva.id);
      setBusca(gestanteAtiva.nome); // Pré-preencher campo de busca com nome da gestante
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
  
  // Estados para cada tipo de ultrassom
  const [primeiroUS, setPrimeiroUS] = useState({
    dataExame: '',
    idadeGestacional: '',
    ccn: '',
    bcf: '',
    sacoVitelino: '',
    hematoma: '',
    corpoLuteo: '',
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
    placentaDistanciaOI: '',
    coloUterinoTV: '',
    coloUterinoMedida: '',
  });
  
  const [morfo2Tri, setMorfo2Tri] = useState({
    dataExame: '',
    idadeGestacional: '',
    biometria: '',
    pesoFetal: '',
    placentaLocalizacao: '',
    placentaGrau: '',
    placentaDistanciaOI: '',
    liquidoAmniotico: '',
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
    placentaDistanciaOI: '',
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

  useEffect(() => {
    if (ultrassons && ultrassons.length > 0) {
      ultrassons.forEach((us: any) => {
        const dados = sanitizeDados(us.dados || {});
        
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
      });
    }
  }, [ultrassons]);
  
  // Função para preencher dados extraídos pela IA
  const handleDadosExtraidos = (tipo: string, dados: Record<string, string>, arquivosProcessados: number = 1) => {
    // Marcar campos que foram preenchidos pela IA para destaque visual
    const camposPreenchidos = new Set(Object.keys(dados).filter(key => dados[key] && dados[key].trim() !== ''));
    setCamposPreenchidosIA(prev => ({
      ...prev,
      [tipo]: camposPreenchidos,
    }));
    
    switch (tipo) {
      case 'primeiro_ultrassom':
        setPrimeiroUS(prev => ({ ...prev, ...dados }));
        break;
      case 'morfologico_1tri':
        setMorfo1Tri(prev => ({ ...prev, ...dados }));
        break;
      case 'ultrassom_obstetrico':
        setUsObstetrico(prev => ({ ...prev, ...dados }));
        break;
      case 'morfologico_2tri':
        setMorfo2Tri(prev => ({ ...prev, ...dados }));
        break;
      case 'ecocardiograma':
        setEcocardiograma(prev => ({ ...prev, ...dados }));
        break;
      case 'ultrassom_seguimento':
        setUsSeguimento(prev => ({ ...prev, ...dados }));
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
    
    await salvarMutation.mutateAsync({
      gestanteId: gestanteSelecionada,
      tipoUltrassom: tipoUltrassom as any,
      dataExame: dataExame || undefined,
      idadeGestacional: idadeGestacional || undefined,
      dados: camposDados,
    });
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
                  <Label>Data Provável do Parto (DPP)</Label>
                  <Input
                    type="date"
                    className={getInputClassName('primeiro_ultrassom', 'dpp')}
                    value={primeiroUS.dpp}
                    onChange={(e) => { removerDestaqueIA('primeiro_ultrassom', 'dpp'); setPrimeiroUS({ ...primeiroUS, dpp: e.target.value }); }}
                  />
                </div>
              </div>
              
              <Button onClick={() => handleSalvar('primeiro_ultrassom', primeiroUS)} disabled={salvarMutation.isPending}>
                {salvarMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                {salvarMutation.isPending ? 'Salvando...' : 'Salvar 1º Ultrassom'}
              </Button>
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
              
              <Button onClick={() => handleSalvar('morfologico_1tri', morfo1Tri)} disabled={salvarMutation.isPending}>
                {salvarMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                {salvarMutation.isPending ? 'Salvando...' : 'Salvar Morfológico 1º Tri'}
              </Button>
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
                <div>
                  <Label>Distância do OI</Label>
                  <Input
                    placeholder="Ex: 5cm"
                    className={getInputClassName('ultrassom_obstetrico', 'placentaDistanciaOI')}
                    value={usObstetrico.placentaDistanciaOI}
                    onChange={(e) => { removerDestaqueIA('ultrassom_obstetrico', 'placentaDistanciaOI'); setUsObstetrico({ ...usObstetrico, placentaDistanciaOI: e.target.value }); }}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Colo Uterino (TV)</Label>
                  <Input
                    placeholder="Sim/Não"
                    className={getInputClassName('ultrassom_obstetrico', 'coloUterinoTV')}
                    value={usObstetrico.coloUterinoTV}
                    onChange={(e) => { removerDestaqueIA('ultrassom_obstetrico', 'coloUterinoTV'); setUsObstetrico({ ...usObstetrico, coloUterinoTV: e.target.value }); }}
                  />
                </div>
                <div>
                  <Label>Medida em mm</Label>
                  <Input
                    placeholder="Ex: 35mm"
                    className={getInputClassName('ultrassom_obstetrico', 'coloUterinoMedida')}
                    value={usObstetrico.coloUterinoMedida}
                    onChange={(e) => { removerDestaqueIA('ultrassom_obstetrico', 'coloUterinoMedida'); setUsObstetrico({ ...usObstetrico, coloUterinoMedida: e.target.value }); }}
                  />
                </div>
              </div>
              
              <Button onClick={() => handleSalvar('ultrassom_obstetrico', usObstetrico)} disabled={salvarMutation.isPending}>
                {salvarMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                {salvarMutation.isPending ? 'Salvando...' : 'Salvar Ultrassom Obstétrico'}
              </Button>
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
                <Textarea
                  placeholder="DBP, CC, CA, CF..."
                  className={getInputClassName('morfologico_2tri', 'biometria')}
                  value={morfo2Tri.biometria}
                  onChange={(e) => { removerDestaqueIA('morfologico_2tri', 'biometria'); setMorfo2Tri({ ...morfo2Tri, biometria: e.target.value }); }}
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
                  <Label>Distância do OI</Label>
                  <Input
                    placeholder="Ex: 5cm"
                    className={getInputClassName('morfologico_2tri', 'placentaDistanciaOI')}
                    value={morfo2Tri.placentaDistanciaOI}
                    onChange={(e) => { removerDestaqueIA('morfologico_2tri', 'placentaDistanciaOI'); setMorfo2Tri({ ...morfo2Tri, placentaDistanciaOI: e.target.value }); }}
                  />
                </div>
              </div>
              
              <div>
                <Label>Líquido Amniótico (ILA)</Label>
                <Input
                  placeholder="Ex: 12cm"
                  className={getInputClassName('morfologico_2tri', 'liquidoAmniotico')}
                  value={morfo2Tri.liquidoAmniotico}
                  onChange={(e) => { removerDestaqueIA('morfologico_2tri', 'liquidoAmniotico'); setMorfo2Tri({ ...morfo2Tri, liquidoAmniotico: e.target.value }); }}
                />
              </div>
              
              <div>
                <Label>Avaliação Anatômica Detalhada</Label>
                <Textarea
                  placeholder="Crânio, face, coluna, tórax, coração, abdome, membros..."
                  className={getInputClassName('morfologico_2tri', 'avaliacaoAnatomica')}
                  value={morfo2Tri.avaliacaoAnatomica}
                  onChange={(e) => { removerDestaqueIA('morfologico_2tri', 'avaliacaoAnatomica'); setMorfo2Tri({ ...morfo2Tri, avaliacaoAnatomica: e.target.value }); }}
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
                <Textarea
                  placeholder="Observações adicionais..."
                  className={getInputClassName('morfologico_2tri', 'observacoes')}
                  value={morfo2Tri.observacoes}
                  onChange={(e) => { removerDestaqueIA('morfologico_2tri', 'observacoes'); setMorfo2Tri({ ...morfo2Tri, observacoes: e.target.value }); }}
                  rows={3}
                />
              </div>
              
              <Button onClick={() => handleSalvar('morfologico_2tri', morfo2Tri)} disabled={salvarMutation.isPending}>
                {salvarMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                {salvarMutation.isPending ? 'Salvando...' : 'Salvar Morfológico 2º Tri'}
              </Button>
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
                <Textarea
                  placeholder="Conclusão do ecocardiograma fetal..."
                  className={getInputClassName('ecocardiograma', 'conclusao')}
                  value={ecocardiograma.conclusao}
                  onChange={(e) => { removerDestaqueIA('ecocardiograma', 'conclusao'); setEcocardiograma({ ...ecocardiograma, conclusao: e.target.value }); }}
                  rows={5}
                />
              </div>
              
              <Button onClick={() => handleSalvar('ecocardiograma_fetal', ecocardiograma)} disabled={salvarMutation.isPending}>
                {salvarMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                {salvarMutation.isPending ? 'Salvando...' : 'Salvar Ecocardiograma'}
              </Button>
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
                  <Label>Distância do OI</Label>
                  <Input
                    placeholder="Ex: 5cm"
                    className={getInputClassName('ultrassom_seguimento', 'placentaDistanciaOI')}
                    value={usSeguimento.placentaDistanciaOI}
                    onChange={(e) => { removerDestaqueIA('ultrassom_seguimento', 'placentaDistanciaOI'); setUsSeguimento({ ...usSeguimento, placentaDistanciaOI: e.target.value }); }}
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
                <Textarea
                  placeholder="Observações adicionais..."
                  className={getInputClassName('ultrassom_seguimento', 'observacoes')}
                  value={usSeguimento.observacoes}
                  onChange={(e) => { removerDestaqueIA('ultrassom_seguimento', 'observacoes'); setUsSeguimento({ ...usSeguimento, observacoes: e.target.value }); }}
                  rows={3}
                />
              </div>
              
              <Button onClick={() => handleSalvar('ultrassom_seguimento', usSeguimento)} disabled={salvarMutation.isPending}>
                {salvarMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                {salvarMutation.isPending ? 'Salvando...' : 'Salvar Ultrassom de Seguimento'}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de Interpretação com IA */}
      <InterpretarUltrassomModal
        open={modalInterpretarAberto}
        onClose={() => setModalInterpretarAberto(false)}
        onDadosExtraidos={handleDadosExtraidos}
      />
      </div>
    </GestantesLayout>
  );
}
