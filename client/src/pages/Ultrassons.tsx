import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import GestantesLayout from '@/components/GestantesLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Loader2, Save, ArrowLeft, Sparkles } from 'lucide-react';
import { useLocation } from 'wouter';
import { InterpretarUltrassomModal } from '@/components/InterpretarUltrassomModal';
import { HistoricoInterpretacoes } from '@/components/HistoricoInterpretacoes';


export default function Ultrassons() {
  const [, setLocation] = useLocation();

  const [gestanteSelecionada, setGestanteSelecionada] = useState<number | null>(null);
  const [busca, setBusca] = useState('');
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
    onSuccess: () => {
      alert('Ultrassom salvo com sucesso!');
      refetchUltrassons();
    },
    onError: (error) => {
      alert(`Erro ao salvar ultrassom: ${error.message}`);
    },
  });
  
  // Mutation para salvar histórico de interpretações
  const salvarHistoricoMutation = trpc.historicoInterpretacoes.salvar.useMutation();
  
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
  
  // Carregar dados quando gestante é selecionada
  useEffect(() => {
    if (ultrassons && ultrassons.length > 0) {
      ultrassons.forEach((us: any) => {
        const dados = us.dados || {};
        
        switch (us.tipoUltrassom) {
          case 'primeiro_ultrassom':
            setPrimeiroUS({
              dataExame: us.dataExame || '',
              idadeGestacional: us.idadeGestacional || '',
              ...dados,
            });
            break;
          case 'morfologico_1tri':
            setMorfo1Tri({
              dataExame: us.dataExame || '',
              idadeGestacional: us.idadeGestacional || '',
              ...dados,
            });
            break;
          case 'ultrassom_obstetrico':
            setUsObstetrico({
              dataExame: us.dataExame || '',
              idadeGestacional: us.idadeGestacional || '',
              ...dados,
            });
            break;
          case 'morfologico_2tri':
            setMorfo2Tri({
              dataExame: us.dataExame || '',
              idadeGestacional: us.idadeGestacional || '',
              ...dados,
            });
            break;
          case 'ecocardiograma_fetal':
            setEcocardiograma({
              dataExame: us.dataExame || '',
              ...dados,
            });
            break;
          case 'ultrassom_seguimento':
            setUsSeguimento({
              dataExame: us.dataExame || '',
              idadeGestacional: us.idadeGestacional || '',
              ...dados,
            });
            break;
        }
      });
    }
  }, [ultrassons]);
  
  // Função para preencher dados extraídos pela IA
  const handleDadosExtraidos = (tipo: string, dados: Record<string, string>, arquivosProcessados: number = 1) => {
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
    
    alert('Dados extraídos com sucesso! Revise os campos e salve.');
  };

  // Função para salvar ultrassom
  const handleSalvar = async (tipoUltrassom: string, dados: any) => {
    if (!gestanteSelecionada) {
      alert('Selecione uma gestante');
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
              <CardTitle>1º Ultrassom</CardTitle>
              <CardDescription>Ultrassom inicial de confirmação da gestação</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Data do Exame</Label>
                  <Input
                    type="date"
                    value={primeiroUS.dataExame}
                    onChange={(e) => setPrimeiroUS({ ...primeiroUS, dataExame: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Idade Gestacional</Label>
                  <Input
                    placeholder="Ex: 7s 2d"
                    value={primeiroUS.idadeGestacional}
                    onChange={(e) => setPrimeiroUS({ ...primeiroUS, idadeGestacional: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>CCN (Comprimento Cabeça-Nádegas)</Label>
                  <Input
                    placeholder="Ex: 12mm"
                    value={primeiroUS.ccn}
                    onChange={(e) => setPrimeiroUS({ ...primeiroUS, ccn: e.target.value })}
                  />
                </div>
                <div>
                  <Label>BCF (Batimento Cardíaco Fetal)</Label>
                  <Input
                    placeholder="Ex: 150 bpm"
                    value={primeiroUS.bcf}
                    onChange={(e) => setPrimeiroUS({ ...primeiroUS, bcf: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Saco Vitelino</Label>
                  <Input
                    placeholder="Presente/Ausente"
                    value={primeiroUS.sacoVitelino}
                    onChange={(e) => setPrimeiroUS({ ...primeiroUS, sacoVitelino: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Presença de Hematoma/Coleções</Label>
                  <Input
                    placeholder="Sim/Não"
                    value={primeiroUS.hematoma}
                    onChange={(e) => setPrimeiroUS({ ...primeiroUS, hematoma: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Identificação do Corpo Lúteo</Label>
                  <Input
                    placeholder="Presente/Ausente"
                    value={primeiroUS.corpoLuteo}
                    onChange={(e) => setPrimeiroUS({ ...primeiroUS, corpoLuteo: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Data Provável do Parto (DPP)</Label>
                  <Input
                    type="date"
                    value={primeiroUS.dpp}
                    onChange={(e) => setPrimeiroUS({ ...primeiroUS, dpp: e.target.value })}
                  />
                </div>
              </div>
              
              <Button onClick={() => handleSalvar('primeiro_ultrassom', primeiroUS)} disabled={salvarMutation.isPending}>
                <Save className="mr-2 h-4 w-4" />
                Salvar 1º Ultrassom
              </Button>
            </CardContent>
          </Card>
          
          {/* Morfológico 1º Trimestre */}
          <Card>
            <CardHeader>
              <CardTitle>Morfológico 1º Trimestre</CardTitle>
              <CardDescription>Ultrassom morfológico com avaliação de translucência nucal</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Data do Exame</Label>
                  <Input
                    type="date"
                    value={morfo1Tri.dataExame}
                    onChange={(e) => setMorfo1Tri({ ...morfo1Tri, dataExame: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Idade Gestacional</Label>
                  <Input
                    placeholder="Ex: 12s 3d"
                    value={morfo1Tri.idadeGestacional}
                    onChange={(e) => setMorfo1Tri({ ...morfo1Tri, idadeGestacional: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Translucência Nucal (TN)</Label>
                  <Input
                    placeholder="Ex: 1.2mm"
                    value={morfo1Tri.tn}
                    onChange={(e) => setMorfo1Tri({ ...morfo1Tri, tn: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Ducto Venoso (DV)</Label>
                  <Input
                    placeholder="Normal/Alterado"
                    value={morfo1Tri.dv}
                    onChange={(e) => setMorfo1Tri({ ...morfo1Tri, dv: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Valva Tricúspide</Label>
                  <Input
                    placeholder="Normal/Alterada"
                    value={morfo1Tri.valvaTricuspide}
                    onChange={(e) => setMorfo1Tri({ ...morfo1Tri, valvaTricuspide: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Doppler das Artérias Uterinas</Label>
                  <Input
                    placeholder="Valor dos IPs"
                    value={morfo1Tri.dopplerUterinas}
                    onChange={(e) => setMorfo1Tri({ ...morfo1Tri, dopplerUterinas: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Incisura Presente?</Label>
                  <Input
                    placeholder="Sim/Não"
                    value={morfo1Tri.incisuraPresente}
                    onChange={(e) => setMorfo1Tri({ ...morfo1Tri, incisuraPresente: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Medida do Colo Uterino</Label>
                  <Input
                    placeholder="Ex: 35mm"
                    value={morfo1Tri.colo}
                    onChange={(e) => setMorfo1Tri({ ...morfo1Tri, colo: e.target.value })}
                  />
                </div>
              </div>
              
              <div>
                <Label>Risco Calculado para Trissomias</Label>
                <Input
                  placeholder="Ex: Baixo risco"
                  value={morfo1Tri.riscoTrissomias}
                  onChange={(e) => setMorfo1Tri({ ...morfo1Tri, riscoTrissomias: e.target.value })}
                />
              </div>
              
              <Button onClick={() => handleSalvar('morfologico_1tri', morfo1Tri)} disabled={salvarMutation.isPending}>
                <Save className="mr-2 h-4 w-4" />
                Salvar Morfológico 1º Tri
              </Button>
            </CardContent>
          </Card>
          
          {/* Ultrassom Obstétrico */}
          <Card>
            <CardHeader>
              <CardTitle>Ultrassom Obstétrico</CardTitle>
              <CardDescription>Ultrassom de rotina para acompanhamento</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Data do Exame</Label>
                  <Input
                    type="date"
                    value={usObstetrico.dataExame}
                    onChange={(e) => setUsObstetrico({ ...usObstetrico, dataExame: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Idade Gestacional</Label>
                  <Input
                    placeholder="Ex: 20s 1d"
                    value={usObstetrico.idadeGestacional}
                    onChange={(e) => setUsObstetrico({ ...usObstetrico, idadeGestacional: e.target.value })}
                  />
                </div>
              </div>
              
              <div>
                <Label>Peso Fetal Estimado</Label>
                <Input
                  placeholder="Ex: 350g"
                  value={usObstetrico.pesoFetal}
                  onChange={(e) => setUsObstetrico({ ...usObstetrico, pesoFetal: e.target.value })}
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Placenta - Localização</Label>
                  <Input
                    placeholder="Ex: Anterior"
                    value={usObstetrico.placentaLocalizacao}
                    onChange={(e) => setUsObstetrico({ ...usObstetrico, placentaLocalizacao: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Placenta - Grau</Label>
                  <Input
                    placeholder="Ex: 0, I, II, III"
                    value={usObstetrico.placentaGrau}
                    onChange={(e) => setUsObstetrico({ ...usObstetrico, placentaGrau: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Distância do OI</Label>
                  <Input
                    placeholder="Ex: 5cm"
                    value={usObstetrico.placentaDistanciaOI}
                    onChange={(e) => setUsObstetrico({ ...usObstetrico, placentaDistanciaOI: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Colo Uterino (TV)</Label>
                  <Input
                    placeholder="Sim/Não"
                    value={usObstetrico.coloUterinoTV}
                    onChange={(e) => setUsObstetrico({ ...usObstetrico, coloUterinoTV: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Medida em mm</Label>
                  <Input
                    placeholder="Ex: 35mm"
                    value={usObstetrico.coloUterinoMedida}
                    onChange={(e) => setUsObstetrico({ ...usObstetrico, coloUterinoMedida: e.target.value })}
                  />
                </div>
              </div>
              
              <Button onClick={() => handleSalvar('ultrassom_obstetrico', usObstetrico)} disabled={salvarMutation.isPending}>
                <Save className="mr-2 h-4 w-4" />
                Salvar Ultrassom Obstétrico
              </Button>
            </CardContent>
          </Card>
          
          {/* Morfológico 2º Trimestre */}
          <Card>
            <CardHeader>
              <CardTitle>Morfológico 2º Trimestre</CardTitle>
              <CardDescription>Ultrassom morfológico detalhado com avaliação anatômica</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Data do Exame</Label>
                  <Input
                    type="date"
                    value={morfo2Tri.dataExame}
                    onChange={(e) => setMorfo2Tri({ ...morfo2Tri, dataExame: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Idade Gestacional</Label>
                  <Input
                    placeholder="Ex: 22s 4d"
                    value={morfo2Tri.idadeGestacional}
                    onChange={(e) => setMorfo2Tri({ ...morfo2Tri, idadeGestacional: e.target.value })}
                  />
                </div>
              </div>
              
              <div>
                <Label>Biometria Completa</Label>
                <Textarea
                  placeholder="DBP, CC, CA, CF..."
                  value={morfo2Tri.biometria}
                  onChange={(e) => setMorfo2Tri({ ...morfo2Tri, biometria: e.target.value })}
                  rows={3}
                />
              </div>
              
              <div>
                <Label>Peso Fetal Estimado</Label>
                <Input
                  placeholder="Ex: 450g"
                  value={morfo2Tri.pesoFetal}
                  onChange={(e) => setMorfo2Tri({ ...morfo2Tri, pesoFetal: e.target.value })}
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Placenta - Localização</Label>
                  <Input
                    placeholder="Ex: Anterior"
                    value={morfo2Tri.placentaLocalizacao}
                    onChange={(e) => setMorfo2Tri({ ...morfo2Tri, placentaLocalizacao: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Placenta - Grau</Label>
                  <Input
                    placeholder="Ex: 0, I, II, III"
                    value={morfo2Tri.placentaGrau}
                    onChange={(e) => setMorfo2Tri({ ...morfo2Tri, placentaGrau: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Distância do OI</Label>
                  <Input
                    placeholder="Ex: 5cm"
                    value={morfo2Tri.placentaDistanciaOI}
                    onChange={(e) => setMorfo2Tri({ ...morfo2Tri, placentaDistanciaOI: e.target.value })}
                  />
                </div>
              </div>
              
              <div>
                <Label>Líquido Amniótico (ILA)</Label>
                <Input
                  placeholder="Ex: 12cm"
                  value={morfo2Tri.liquidoAmniotico}
                  onChange={(e) => setMorfo2Tri({ ...morfo2Tri, liquidoAmniotico: e.target.value })}
                />
              </div>
              
              <div>
                <Label>Avaliação Anatômica Detalhada</Label>
                <Textarea
                  placeholder="Crânio, face, coluna, tórax, coração, abdome, membros..."
                  value={morfo2Tri.avaliacaoAnatomica}
                  onChange={(e) => setMorfo2Tri({ ...morfo2Tri, avaliacaoAnatomica: e.target.value })}
                  rows={4}
                />
              </div>
              
              <div>
                <Label>Dopplers (se realizados)</Label>
                <Input
                  placeholder="AU, ACM, DV..."
                  value={morfo2Tri.dopplers}
                  onChange={(e) => setMorfo2Tri({ ...morfo2Tri, dopplers: e.target.value })}
                />
              </div>
              
              <div>
                <Label>Sexo Fetal (se desejado)</Label>
                <Input
                  placeholder="Masculino/Feminino"
                  value={morfo2Tri.sexoFetal}
                  onChange={(e) => setMorfo2Tri({ ...morfo2Tri, sexoFetal: e.target.value })}
                />
              </div>
              
              <div>
                <Label>Observações</Label>
                <Textarea
                  placeholder="Observações adicionais..."
                  value={morfo2Tri.observacoes}
                  onChange={(e) => setMorfo2Tri({ ...morfo2Tri, observacoes: e.target.value })}
                  rows={3}
                />
              </div>
              
              <Button onClick={() => handleSalvar('morfologico_2tri', morfo2Tri)} disabled={salvarMutation.isPending}>
                <Save className="mr-2 h-4 w-4" />
                Salvar Morfológico 2º Tri
              </Button>
            </CardContent>
          </Card>
          
          {/* Ecocardiograma Fetal */}
          <Card>
            <CardHeader>
              <CardTitle>Ecocardiograma Fetal</CardTitle>
              <CardDescription>Avaliação especializada do coração fetal</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Data do Exame</Label>
                <Input
                  type="date"
                  value={ecocardiograma.dataExame}
                  onChange={(e) => setEcocardiograma({ ...ecocardiograma, dataExame: e.target.value })}
                />
              </div>
              
              <div>
                <Label>Conclusão</Label>
                <Textarea
                  placeholder="Conclusão do ecocardiograma fetal..."
                  value={ecocardiograma.conclusao}
                  onChange={(e) => setEcocardiograma({ ...ecocardiograma, conclusao: e.target.value })}
                  rows={5}
                />
              </div>
              
              <Button onClick={() => handleSalvar('ecocardiograma_fetal', ecocardiograma)} disabled={salvarMutation.isPending}>
                <Save className="mr-2 h-4 w-4" />
                Salvar Ecocardiograma
              </Button>
            </CardContent>
          </Card>
          
          {/* Ultrassons de Seguimento */}
          <Card>
            <CardHeader>
              <CardTitle>Ultrassons de Seguimento</CardTitle>
              <CardDescription>Ultrassons de acompanhamento após morfológico 2º trimestre (3 a 5 exames)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Data do Exame</Label>
                  <Input
                    type="date"
                    value={usSeguimento.dataExame}
                    onChange={(e) => setUsSeguimento({ ...usSeguimento, dataExame: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Idade Gestacional</Label>
                  <Input
                    placeholder="Ex: 32s 1d"
                    value={usSeguimento.idadeGestacional}
                    onChange={(e) => setUsSeguimento({ ...usSeguimento, idadeGestacional: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Peso Fetal Estimado</Label>
                  <Input
                    placeholder="Ex: 2100g"
                    value={usSeguimento.pesoFetal}
                    onChange={(e) => setUsSeguimento({ ...usSeguimento, pesoFetal: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Percentil do Peso Fetal</Label>
                  <Input
                    placeholder="Ex: P50"
                    value={usSeguimento.percentilPeso}
                    onChange={(e) => setUsSeguimento({ ...usSeguimento, percentilPeso: e.target.value })}
                  />
                </div>
              </div>
              
              <div>
                <Label>Líquido Amniótico (ILA ou subjetivo)</Label>
                <Input
                  placeholder="Ex: 10cm ou Normal"
                  value={usSeguimento.liquidoAmniotico}
                  onChange={(e) => setUsSeguimento({ ...usSeguimento, liquidoAmniotico: e.target.value })}
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Placenta - Localização</Label>
                  <Input
                    placeholder="Ex: Anterior"
                    value={usSeguimento.placentaLocalizacao}
                    onChange={(e) => setUsSeguimento({ ...usSeguimento, placentaLocalizacao: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Placenta - Grau</Label>
                  <Input
                    placeholder="Ex: II"
                    value={usSeguimento.placentaGrau}
                    onChange={(e) => setUsSeguimento({ ...usSeguimento, placentaGrau: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Distância do OI</Label>
                  <Input
                    placeholder="Ex: 5cm"
                    value={usSeguimento.placentaDistanciaOI}
                    onChange={(e) => setUsSeguimento({ ...usSeguimento, placentaDistanciaOI: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Movimentos Fetais</Label>
                  <Input
                    placeholder="Presentes/Ausentes"
                    value={usSeguimento.movimentosFetais}
                    onChange={(e) => setUsSeguimento({ ...usSeguimento, movimentosFetais: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Apresentação Fetal</Label>
                  <Input
                    placeholder="Cefálica/Pélvica/Transversa"
                    value={usSeguimento.apresentacaoFetal}
                    onChange={(e) => setUsSeguimento({ ...usSeguimento, apresentacaoFetal: e.target.value })}
                  />
                </div>
              </div>
              
              <div>
                <Label>Dopplers (AU, ACM, DV se indicado)</Label>
                <Input
                  placeholder="Valores dos dopplers..."
                  value={usSeguimento.dopplers}
                  onChange={(e) => setUsSeguimento({ ...usSeguimento, dopplers: e.target.value })}
                />
              </div>
              
              <div>
                <Label>Observações</Label>
                <Textarea
                  placeholder="Observações adicionais..."
                  value={usSeguimento.observacoes}
                  onChange={(e) => setUsSeguimento({ ...usSeguimento, observacoes: e.target.value })}
                  rows={3}
                />
              </div>
              
              <Button onClick={() => handleSalvar('ultrassom_seguimento', usSeguimento)} disabled={salvarMutation.isPending}>
                <Save className="mr-2 h-4 w-4" />
                Salvar Ultrassom de Seguimento
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
