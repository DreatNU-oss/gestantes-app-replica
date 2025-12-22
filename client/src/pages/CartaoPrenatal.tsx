import GestantesLayout from "@/components/GestantesLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, Calendar, FileText, Plus, Trash2, Edit2, Download, Copy, Baby, Activity, Syringe, CheckCircle2, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { useGestanteAtiva } from "@/contexts/GestanteAtivaContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AutocompleteSelect } from "@/components/AutocompleteSelect";
import { GraficoPeso } from "@/components/GraficoPeso";
import { CartaoPrenatalPDF } from "@/components/CartaoPrenatalPDF";
import { toast } from "sonner";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function CartaoPrenatal() {
  const [, setLocation] = useLocation();
  const { gestanteAtiva } = useGestanteAtiva();
  
  const getDataHoje = () => {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  };

  const [gestanteSelecionada, setGestanteSelecionada] = useState<number | null>(gestanteAtiva?.id || null);
  
  // Atualizar gestante selecionada quando gestante ativa mudar
  useEffect(() => {
    if (gestanteAtiva) {
      setGestanteSelecionada(gestanteAtiva.id);
    }
  }, [gestanteAtiva]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [consultaEditando, setConsultaEditando] = useState<number | null>(null);
  const [isGerandoPDF, setIsGerandoPDF] = useState(false);
  const pdfRef = useRef<HTMLDivElement>(null);


  // Lista de opções de conduta predefinidas
  const OPCOES_CONDUTA = [
    "Rotina Laboratorial 1º Trimestre",
    "Rotina Laboratorial 2º Trimestre",
    "Rotina Laboratorial 3º Trimestre",
    "Outros Exames Laboratoriais Específicos",
    "US Obstétrico Endovaginal",
    "US Morfológico 1º Trimestre",
    "US Morfológico 2º Trimestre",
    "US Obstétrico com Doppler",
    "Ecocardiograma Fetal",
    "Colhido Cultura para EGB",
    "Antibioticoterapia",
    "Progesterona Micronizada",
    "Vacinas (Prescrevo ou Oriento)",
    "Levotiroxina",
    "AAS",
    "Agendamento Cesárea",
    "Indico Curetagem Uterina",
    "Acompanhamento Rotina",
  ];

  const [formData, setFormData] = useState({
    dataConsulta: getDataHoje(),
    peso: "",
    pressaoArterial: "",
    alturaUterina: "",
    bcf: "",
    mf: "",
    conduta: [] as string[],
    condutaComplementacao: "",
    observacoes: "",
  });

  const { data: gestantes, isLoading: loadingGestantes } = trpc.gestantes.list.useQuery();
  const { data: gestante } = trpc.gestantes.get.useQuery(
    { id: gestanteSelecionada! },
    { enabled: !!gestanteSelecionada }
  );
  const { data: consultas, refetch: refetchConsultas } = trpc.consultasPrenatal.list.useQuery(
    { gestanteId: gestanteSelecionada! },
    { enabled: !!gestanteSelecionada }
  );
  const { data: ultrassons } = trpc.ultrassons.buscar.useQuery(
    { gestanteId: gestanteSelecionada! },
    { enabled: !!gestanteSelecionada }
  );
  const { data: exames } = trpc.exames.list.useQuery(
    { gestanteId: gestanteSelecionada! },
    { enabled: !!gestanteSelecionada }
  );
  const { data: resultadosExamesLab } = trpc.examesLab.buscar.useQuery(
    { gestanteId: gestanteSelecionada! },
    { enabled: !!gestanteSelecionada }
  );

  // Buscar condutas personalizadas
  const { data: condutasPersonalizadas, refetch: refetchCondutas } = trpc.condutas.list.useQuery();
  const createCondutaMutation = trpc.condutas.create.useMutation({
    onSuccess: () => {
      toast.success("Conduta personalizada adicionada!");
      refetchCondutas();
      setNovaConduta("");
      setMostrarAddConduta(false);
    },
    onError: (error) => {
      toast.error("Erro ao adicionar conduta: " + error.message);
    },
  });
  const deleteCondutaMutation = trpc.condutas.delete.useMutation({
    onSuccess: () => {
      toast.success("Conduta removida!");
      refetchCondutas();
    },
  });

  const [novaConduta, setNovaConduta] = useState("");
  const [mostrarAddConduta, setMostrarAddConduta] = useState(false);

  // Combinar condutas predefinidas com personalizadas
  const todasCondutas = [
    ...OPCOES_CONDUTA,
    ...(condutasPersonalizadas?.map(c => c.nome) || [])
  ];

  const createMutation = trpc.consultasPrenatal.create.useMutation({
    onSuccess: () => {
      toast.success("Consulta registrada com sucesso!");
      refetchConsultas();
      resetForm();
    },
    onError: (error) => {
      toast.error(`Erro ao registrar consulta: ${error.message}`);
    },
  });

  const updateMutation = trpc.consultasPrenatal.update.useMutation({
    onSuccess: () => {
      toast.success("Consulta atualizada com sucesso!");
      refetchConsultas();
      resetForm();
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar consulta: ${error.message}`);
    },
  });

  const deleteMutation = trpc.consultasPrenatal.delete.useMutation({
    onSuccess: () => {
      toast.success("Consulta excluída com sucesso!");
      refetchConsultas();
    },
    onError: (error) => {
      toast.error(`Erro ao excluir consulta: ${error.message}`);
    },
  });

  const handleGerarPDF = async () => {
    if (!gestante) {
      toast.error('Selecione uma gestante primeiro');
      return;
    }
    
    setIsGerandoPDF(true);
    try {
      // Criar PDF diretamente com jsPDF
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });
      
      // Adicionar conteúdo ao PDF
      let y = 15;
      
      // Adicionar logo da clínica no cabeçalho
      try {
        // Logo horizontal da clínica Mais Mulher
        const logoImg = new Image();
        logoImg.src = '/logo-horizontal.png';
        await new Promise((resolve, reject) => {
          logoImg.onload = resolve;
          logoImg.onerror = reject;
        });
        
        // Adicionar logo centralizado (largura 60mm, altura 26.7mm - mantendo aspect ratio 2.25:1)
        const logoWidth = 60;
        const pageWidth = pdf.internal.pageSize.getWidth();
        const logoX = (pageWidth - logoWidth) / 2; // Centralizar horizontalmente
        pdf.addImage(logoImg, 'PNG', logoX, y, logoWidth, 26.7);
      } catch (error) {
        console.warn('Erro ao carregar logo:', error);
      }
      
      y += 35; // Espaço após o logo (aumentado de 30 para 35)
      
      // Título abaixo do logo
      pdf.setFontSize(18);
      pdf.setTextColor(139, 64, 73);
      pdf.text('Cartão de Pré-natal', 20, y);
      y += 15;
      
      // Dados da Gestante
      pdf.setFontSize(14);
      pdf.text('Dados da Gestante', 20, y);
      y += 10;
      
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      const idade = gestante.calculado?.idade || '-';
      pdf.text(`Nome: ${gestante.nome} - Idade: ${idade} anos`, 20, y);
      y += 7;
      
      // Formatar dados obstétricos no padrão médico (ex: G5P3(2PC1PN)A1)
      const gesta = gestante.gesta || 0;
      const para = gestante.para || 0;
      const cesareas = gestante.cesareas || 0;
      const partosNormais = gestante.partosNormais || 0;
      const abortos = gestante.abortos || 0;
      
      let notacaoObstetrica = `G${gesta}P${para}`;
      if (para > 0) {
        notacaoObstetrica += `(${cesareas}PC${partosNormais}PN)`;
      }
      notacaoObstetrica += `A${abortos}`;
      
      pdf.text(notacaoObstetrica, 20, y);
      y += 7;
      pdf.text(`DPP pela DUM: ${gestante.calculado.dpp ? new Date(gestante.calculado.dpp).toLocaleDateString('pt-BR') : '-'}`, 20, y);
      y += 7;
      pdf.text(`DPP pelo Ultrassom: ${gestante.calculado.dppUS ? new Date(gestante.calculado.dppUS).toLocaleDateString('pt-BR') : '-'}`, 20, y);
      y += 15;
      
      // Histórico de Consultas
      if (consultas && consultas.length > 0) {
        pdf.setFontSize(14);
        pdf.setTextColor(139, 64, 73);
        pdf.text('Histórico de Consultas', 20, y);
        y += 10;
        
        pdf.setFontSize(9);
        pdf.setTextColor(0, 0, 0);
        
        consultas.forEach((consulta: any) => {
          if (y > 270) {
            pdf.addPage();
            y = 20;
          }
          
          // Calcular IG pela DUM
          let igTexto = '-';
          if (gestante.dum) {
            const dum = new Date(gestante.dum);
            const dataConsulta = new Date(consulta.dataConsulta);
            const diffMs = dataConsulta.getTime() - dum.getTime();
            const totalDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            const semanas = Math.floor(totalDias / 7);
            const dias = totalDias % 7;
            igTexto = `${semanas}s${dias}d`;
          }
          
          const pesoFormatado = consulta.peso ? `${(consulta.peso / 1000).toFixed(1)} kg` : '-';
          const bcf = consulta.bcf ? 'Sim' : 'Não';
          const mf = consulta.mf ? 'Sim' : 'Não';
          
          pdf.text(`Data: ${new Date(consulta.dataConsulta).toLocaleDateString('pt-BR')} | IG: ${igTexto}`, 20, y);
          y += 5;
          const paFormatado = consulta.pressaoArterial || '-';
          const auFormatado = consulta.alturaUterina ? `${(consulta.alturaUterina / 10).toFixed(0)}cm` : '-';
          pdf.text(`Peso: ${pesoFormatado} | PA: ${paFormatado} | AU: ${auFormatado}`, 20, y);
          y += 5;
          pdf.text(`BCF: ${bcf} | MF: ${mf}`, 20, y);
          y += 5;
          
          // Adicionar condutas com formatação visual melhorada
          if (consulta.conduta || consulta.condutaComplementacao) {
            // Desenhar caixa de destaque para condutas
            const hasConduta = consulta.conduta && JSON.parse(consulta.conduta).length > 0;
            const hasComplementacao = consulta.condutaComplementacao;
            
            if (hasConduta || hasComplementacao) {
              // Verificar se precisa de nova página
              if (y > 255) {
                pdf.addPage();
                y = 20;
              }
              
              // Fundo suave para a seção de conduta
              pdf.setFillColor(248, 240, 241); // Rosa bem claro
              pdf.setDrawColor(139, 64, 73); // Cor da clínica
              
              // Calcular altura da caixa baseado no conteúdo
              let alturaBox = 8;
              let condutaTexto = '';
              let linhasConduta: string[] = [];
              let linhasCompl: string[] = [];
              
              if (hasConduta) {
                try {
                  const condutas = JSON.parse(consulta.conduta);
                  condutaTexto = condutas.join(' \u2022 '); // Separador com bullet
                  linhasConduta = pdf.splitTextToSize(condutaTexto, 160);
                  alturaBox += linhasConduta.length * 4.5;
                } catch (e) {}
              }
              
              if (hasComplementacao) {
                linhasCompl = pdf.splitTextToSize(consulta.condutaComplementacao, 160);
                alturaBox += linhasCompl.length * 4.5 + 3;
              }
              
              // Desenhar retângulo com borda arredondada
              pdf.roundedRect(20, y - 1, 170, alturaBox, 2, 2, 'FD');
              
              // Título "CONDUTA" em destaque
              pdf.setFontSize(8);
              pdf.setFont(undefined, 'bold');
              pdf.setTextColor(139, 64, 73); // Cor da clínica
              pdf.text('CONDUTA:', 23, y + 4);
              
              // Texto das condutas
              pdf.setFont(undefined, 'normal');
              pdf.setTextColor(60, 60, 60);
              pdf.setFontSize(8);
              
              let yTexto = y + 4;
              
              if (hasConduta && linhasConduta.length > 0) {
                // Primeira linha ao lado do título
                pdf.text(linhasConduta[0], 48, yTexto);
                yTexto += 4.5;
                
                // Linhas adicionais
                for (let i = 1; i < linhasConduta.length; i++) {
                  pdf.text(linhasConduta[i], 23, yTexto);
                  yTexto += 4.5;
                }
              }
              
              // Complementação em itálico
              if (hasComplementacao) {
                yTexto += 5; // Aumentar espaço antes da complementação
                pdf.setFont(undefined, 'italic');
                pdf.setTextColor(100, 100, 100);
                pdf.text('Complementação:', 23, yTexto);
                yTexto += 4.5;
                
                pdf.setFont(undefined, 'normal');
                linhasCompl.forEach((linha: string) => {
                  pdf.text(linha, 23, yTexto);
                  yTexto += 4.5;
                });
              }
              
              // Resetar cores
              pdf.setTextColor(0, 0, 0);
              pdf.setFontSize(9);
              
              y += alturaBox + 3;
            }
          }
          
          if (consulta.observacoes) {
            pdf.text(`Obs: ${consulta.observacoes}`, 20, y);
            y += 5;
          }
          y += 3;
        });
        y += 5;
      }
      
      // Marcos Importantes
      if (gestante.calculado?.dppUS) {
        if (y > 230) {
          pdf.addPage();
          y = 20;
        }
        
        pdf.setFontSize(14);
        pdf.setTextColor(139, 64, 73);
        pdf.text('Marcos Importantes da Gesta\u00e7\u00e3o', 20, y);
        y += 10;
        
        const dppUS = new Date(gestante.calculado.dppUS);
        const concepcao = new Date(dppUS);
        concepcao.setDate(concepcao.getDate() - 280);
        
        const marcosData = [
          { titulo: 'Concep\u00e7\u00e3o', data: concepcao, color: [216, 180, 254] }, // purple-300
          { titulo: 'Morfol\u00f3gico 1\u00ba Tri (11-13s)', inicio: new Date(concepcao.getTime() + 77*24*60*60*1000), fim: new Date(concepcao.getTime() + 98*24*60*60*1000), color: [110, 231, 183] }, // emerald-300
          { titulo: '13 Semanas', data: new Date(concepcao.getTime() + 91*24*60*60*1000), color: [147, 197, 253] }, // blue-300
          { titulo: 'Morfol\u00f3gico 2\u00ba Tri (20-24s)', inicio: new Date(concepcao.getTime() + 140*24*60*60*1000), fim: new Date(concepcao.getTime() + 168*24*60*60*1000), color: [103, 232, 249] }, // cyan-300
          { titulo: 'Vacina dTpa (27s)', data: new Date(concepcao.getTime() + 189*24*60*60*1000), color: [253, 186, 116] }, // orange-300
          { titulo: 'Vacina Bronquiolite (32-36s)', inicio: new Date(concepcao.getTime() + 224*24*60*60*1000), fim: new Date(concepcao.getTime() + 252*24*60*60*1000), color: [253, 224, 71] }, // yellow-300
          { titulo: 'Termo Precoce (37s)', data: new Date(concepcao.getTime() + 259*24*60*60*1000), color: [103, 232, 249] }, // cyan-300
          { titulo: 'Termo Completo (39s)', data: new Date(concepcao.getTime() + 273*24*60*60*1000), color: [134, 239, 172] }, // green-300
          { titulo: 'DPP (40 semanas)', data: dppUS, color: [253, 164, 175] }, // rose-300
        ];
        
        pdf.setFontSize(9);
        
        // Organizar marcos em 2 colunas
        let coluna = 0;
        let xPos = 20;
        const larguraColuna = 85;
        const espacoEntreLinhas = 9;
        
        marcosData.forEach((marco: any, index: number) => {
          if (y > 265 && coluna === 0) {
            pdf.addPage();
            y = 20;
          }
          
          // Calcular posição X baseado na coluna
          xPos = coluna === 0 ? 20 : 110;
          
          // Desenhar retângulo colorido
          pdf.setFillColor(marco.color[0], marco.color[1], marco.color[2]);
          pdf.setDrawColor(marco.color[0] * 0.8, marco.color[1] * 0.8, marco.color[2] * 0.8);
          pdf.roundedRect(xPos, y - 3, larguraColuna, 7, 1, 1, 'FD');
          
          // Texto do marco (cor escura para melhor legibilidade)
          pdf.setTextColor(30, 30, 30);
          pdf.setFont(undefined, 'bold');
          pdf.text(marco.titulo, xPos + 2, y + 2);
          
          // Data (ajustar para caber na coluna)
          const dataTexto = marco.inicio 
            ? `${marco.inicio.toLocaleDateString('pt-BR').substring(0, 5)} a ${marco.fim.toLocaleDateString('pt-BR').substring(0, 5)}`
            : marco.data.toLocaleDateString('pt-BR');
          pdf.setFontSize(8);
          pdf.text(dataTexto, xPos + larguraColuna - 2, y + 2, { align: 'right' });
          pdf.setFontSize(9);
          
          pdf.setFont(undefined, 'normal');
          
          // Alternar entre colunas
          coluna = coluna === 0 ? 1 : 0;
          if (coluna === 0) {
            y += espacoEntreLinhas;
          }
        });
        
        // Se terminou em coluna 1, avançar y
        if (coluna === 1) {
          y += espacoEntreLinhas;
        }
        
        pdf.setTextColor(0, 0, 0);
        y += 5;
      }
      
      // Exames Laboratoriais
      if (resultadosExamesLab && Object.keys(resultadosExamesLab).length > 0) {
        if (y > 250) {
          pdf.addPage();
          y = 20;
        }
        
        pdf.setFontSize(14);
        pdf.setTextColor(139, 64, 73);
        pdf.text('Exames Laboratoriais', 20, y);
        y += 10;
        
        // Cabeçalhos das colunas (uma única vez no topo)
        const col1X = 22;
        const col2X = 80;
        const col3X = 138;
        
        pdf.setFontSize(11);
        pdf.setTextColor(0, 0, 0);
        pdf.setFont(undefined, 'bold');
        pdf.text('1º Trimestre', col1X, y);
        pdf.text('2º Trimestre', col2X, y);
        pdf.text('3º Trimestre', col3X, y);
        y += 6;
        
        // Linha separadora
        pdf.setDrawColor(139, 64, 73);
        pdf.line(20, y, 190, y);
        y += 5;
        
        pdf.setFontSize(9);
        pdf.setFont(undefined, 'normal');
        
        // Iterar pelos exames estruturados
        for (const [nomeExame, valor] of Object.entries(resultadosExamesLab)) {
          if (nomeExame === 'outros_observacoes') {
            // Pular observações gerais
            continue;
          }
          
          if (y > 260) {
            pdf.addPage();
            y = 20;
          }
          
          // Nome do exame em negrito
          pdf.setFont(undefined, 'bold');
          pdf.text(nomeExame.replace(/_/g, ' ').toUpperCase(), 20, y);
          y += 5;
          
          // Se for objeto com trimestres, mostrar em 3 colunas
          if (typeof valor === 'object' && valor !== null) {
            // Filtrar apenas trimestres (1, 2, 3), ignorar campos data1, data2, data3
            const trimestres = ['1', '2', '3'];
            const resultadosTrimestres = trimestres.map(t => {
              const resultado = valor[t];
              // Ignorar se for uma data (formato YYYY-MM-DD)
              if (resultado && typeof resultado === 'string' && !/^\d{4}-\d{2}-\d{2}$/.test(resultado.trim())) {
                return resultado;
              }
              return '-';
            });
            
            // Verificar se tem pelo menos um resultado válido
            const temResultado = resultadosTrimestres.some(r => r !== '-');
            
            if (temResultado) {
              pdf.setFont(undefined, 'normal');
              pdf.setFontSize(8);
              
              // Extrair datas dos trimestres
              const datas = trimestres.map(t => {
                const dataKey = `data${t}`;
                const dataValor = valor[dataKey];
                if (dataValor && typeof dataValor === 'string') {
                  // Converter YYYY-MM-DD para DD/MM/AAAA
                  const partes = dataValor.split('-');
                  if (partes.length === 3) {
                    return `${partes[2]}/${partes[1]}/${partes[0]}`;
                  }
                }
                return '-';
              });
              
              // Mostrar datas em cinza e itálico
              pdf.setFont(undefined, 'italic');
              pdf.setTextColor(100, 100, 100);
              pdf.text(datas[0], col1X, y);
              pdf.text(datas[1], col2X, y);
              pdf.text(datas[2], col3X, y);
              y += 4;
              
              // Resultados
              pdf.setFont(undefined, 'normal');
              pdf.setTextColor(0, 0, 0);
              const linhas1 = pdf.splitTextToSize(resultadosTrimestres[0], 55);
              const linhas2 = pdf.splitTextToSize(resultadosTrimestres[1], 55);
              const linhas3 = pdf.splitTextToSize(resultadosTrimestres[2], 55);
              
              const maxLinhas = Math.max(linhas1.length, linhas2.length, linhas3.length);
              
              for (let i = 0; i < maxLinhas; i++) {
                if (y > 275) {
                  pdf.addPage();
                  y = 20;
                }
                if (i < linhas1.length) pdf.text(linhas1[i], col1X, y);
                if (i < linhas2.length) pdf.text(linhas2[i], col2X, y);
                if (i < linhas3.length) pdf.text(linhas3[i], col3X, y);
                y += 4;
              }
              
              pdf.setFontSize(9);
            }
          }
          y += 2;
        }
        
        // Observações gerais
        if (resultadosExamesLab.outros_observacoes && typeof resultadosExamesLab.outros_observacoes === 'string' && resultadosExamesLab.outros_observacoes.trim()) {
          if (y > 260) {
            pdf.addPage();
            y = 20;
          }
          pdf.setFont(undefined, 'bold');
          pdf.text('OBSERVAÇÕES:', 20, y);
          y += 5;
          pdf.setFont(undefined, 'normal');
          const linhasObs = pdf.splitTextToSize(resultadosExamesLab.outros_observacoes, 170);
          linhasObs.forEach((linha: string) => {
            if (y > 275) {
              pdf.addPage();
              y = 20;
            }
            pdf.text(linha, 22, y);
            y += 4;
          });
        }
        
        y += 5;
      }
      
      // Ultrassons
      if (ultrassons && ultrassons.length > 0) {
        if (y > 250) {
          pdf.addPage();
          y = 20;
        }
        
        pdf.setFontSize(14);
        pdf.setTextColor(139, 64, 73);
        pdf.text('Ultrassons', 20, y);
        y += 10;
        
        // Cabeçalho da tabela
        pdf.setFontSize(9);
        pdf.setTextColor(0, 0, 0);
        pdf.setFont(undefined, 'bold');
        pdf.text('Data', 20, y);
        pdf.text('Tipo', 50, y);
        pdf.text('IG', 100, y);
        pdf.text('Dados', 120, y);
        y += 5;
        
        // Linha separadora
        pdf.setDrawColor(139, 64, 73);
        pdf.line(20, y, 190, y);
        y += 5;
        
        pdf.setFont(undefined, 'normal');
        
        ultrassons.forEach((us: any) => {
          if (y > 270) {
            pdf.addPage();
            y = 20;
            // Repetir cabeçalho na nova página
            pdf.setFont(undefined, 'bold');
            pdf.text('Data', 20, y);
            pdf.text('Tipo', 50, y);
            pdf.text('IG', 100, y);
            pdf.text('Dados', 120, y);
            y += 5;
            pdf.line(20, y, 190, y);
            y += 5;
            pdf.setFont(undefined, 'normal');
          }
          
          const dataExame = us.dataExame ? new Date(us.dataExame).toLocaleDateString('pt-BR') : '-';
          const tipo = us.tipoUltrassom?.replace(/_/g, ' ') || '-';
          const ig = us.idadeGestacional || '-';
          
          // Extrair dados principais do JSON
          let dadosTexto = '-';
          let usarMultiplasLinhas = false;
          if (us.dados) {
            const dados = typeof us.dados === 'string' ? JSON.parse(us.dados) : us.dados;
            // Priorizar dados mais relevantes de cada tipo de exame
            if (dados.conclusao) {
              dadosTexto = dados.conclusao; // Ecocardiograma e outros
              usarMultiplasLinhas = dados.conclusao.length > 35; // Se for longo, usar múltiplas linhas
            }
            else if (dados.dpp) dadosTexto = `DPP: ${dados.dpp}`;
            else if (dados.pesoFetal) dadosTexto = `Peso: ${dados.pesoFetal}g`;
            else if (dados.bcf) dadosTexto = `BCF: ${dados.bcf}bpm`;
            else if (dados.tn) dadosTexto = `TN: ${dados.tn}mm`;
            else if (dados.ccn) dadosTexto = `CCN: ${dados.ccn}mm`;
          }
          
          pdf.text(dataExame, 20, y);
          pdf.text(tipo.substring(0, 20), 50, y);
          pdf.text(ig, 100, y);
          
          // Se for texto longo (conclusão), quebrar em múltiplas linhas
          if (usarMultiplasLinhas) {
            const linhasDados = pdf.splitTextToSize(dadosTexto, 70); // Largura de 70mm para os dados
            linhasDados.forEach((linha: string, idx: number) => {
              pdf.text(linha, 120, y + (idx * 4));
            });
            y += Math.max(5, linhasDados.length * 4); // Avançar mais se tiver múltiplas linhas
          } else {
            pdf.text(dadosTexto.substring(0, 35), 120, y);
            y += 5;
          }
        });
      }
      
      
      // Abrir PDF em nova aba ao invés de baixar
      const pdfBlob = pdf.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, '_blank');
      
      toast.success("PDF aberto em nova aba!");
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.error(`Erro ao gerar PDF: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setIsGerandoPDF(false);
    }
  };

  const resetForm = () => {
    setFormData({
      dataConsulta: getDataHoje(),
      peso: "",
      pressaoArterial: "",
      alturaUterina: "",
      bcf: "",
      mf: "",
      conduta: [],
      condutaComplementacao: "",
      observacoes: "",
    });
    setMostrarFormulario(false);
    setConsultaEditando(null);
  };

  // Função para toggle de conduta no checkbox
  const toggleConduta = (opcao: string) => {
    setFormData(prev => ({
      ...prev,
      conduta: prev.conduta.includes(opcao)
        ? prev.conduta.filter(c => c !== opcao)
        : [...prev.conduta, opcao]
    }));
  };

  const calcularMarcos = () => {
    if (!gestante?.calculado?.dppUS) return [];
    
    const dppUS = new Date(gestante.calculado.dppUS);
    const marcos = [];
    
    // Concepção
    const concepcao = new Date(dppUS);
    concepcao.setDate(concepcao.getDate() - 280);
    marcos.push({ titulo: "Concepção", data: concepcao.toLocaleDateString("pt-BR") });
    
    // Morfológico 1º Tri (11-14 semanas)
    const morf1Inicio = new Date(concepcao);
    morf1Inicio.setDate(morf1Inicio.getDate() + 77);
    const morf1Fim = new Date(concepcao);
    morf1Fim.setDate(morf1Fim.getDate() + 98);
    marcos.push({ titulo: "Morfológico 1º Tri", data: `${morf1Inicio.toLocaleDateString("pt-BR")} a ${morf1Fim.toLocaleDateString("pt-BR")}` });
    
    // 13 Semanas
    const s13 = new Date(concepcao);
    s13.setDate(s13.getDate() + 91);
    marcos.push({ titulo: "13 Semanas", data: s13.toLocaleDateString("pt-BR") });
    
    // Morfológico 2º Tri (20-24 semanas)
    const morf2Inicio = new Date(concepcao);
    morf2Inicio.setDate(morf2Inicio.getDate() + 140);
    const morf2Fim = new Date(concepcao);
    morf2Fim.setDate(morf2Fim.getDate() + 168);
    marcos.push({ titulo: "Morfológico 2º Tri", data: `${morf2Inicio.toLocaleDateString("pt-BR")} a ${morf2Fim.toLocaleDateString("pt-BR")}` });
    
    // Vacina dTpa (27 semanas)
    const dtpa = new Date(concepcao);
    dtpa.setDate(dtpa.getDate() + 189);
    marcos.push({ titulo: "Vacina dTpa", data: dtpa.toLocaleDateString("pt-BR") });
    
    // Vacina Bronquiolite (32-36 semanas)
    const bronqInicio = new Date(concepcao);
    bronqInicio.setDate(bronqInicio.getDate() + 224);
    const bronqFim = new Date(concepcao);
    bronqFim.setDate(bronqFim.getDate() + 252);
    marcos.push({ titulo: "Vacina Bronquiolite", data: `${bronqInicio.toLocaleDateString("pt-BR")} a ${bronqFim.toLocaleDateString("pt-BR")}` });
    
    // Termo Precoce (37 semanas)
    const termoPrecoce = new Date(concepcao);
    termoPrecoce.setDate(termoPrecoce.getDate() + 259);
    marcos.push({ titulo: "Termo Precoce", data: termoPrecoce.toLocaleDateString("pt-BR") });
    
    // Termo Completo (39 semanas)
    const termoCompleto = new Date(concepcao);
    termoCompleto.setDate(termoCompleto.getDate() + 273);
    marcos.push({ titulo: "Termo Completo", data: termoCompleto.toLocaleDateString("pt-BR") });
    
    // DPP (40 semanas)
    marcos.push({ titulo: "DPP (40 semanas)", data: dppUS.toLocaleDateString("pt-BR") });
    
    return marcos;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!gestanteSelecionada) {
      toast.error("Selecione uma gestante");
      return;
    }

    const data = {
      gestanteId: gestanteSelecionada,
      dataConsulta: formData.dataConsulta,
      peso: formData.peso ? parseInt(formData.peso) * 1000 : undefined, // converter kg para gramas
      pressaoArterial: formData.pressaoArterial || undefined,
      alturaUterina: formData.alturaUterina === "nao_palpavel" ? -1 : (formData.alturaUterina ? parseInt(formData.alturaUterina) * 10 : undefined), // -1 = não palpável, converter cm para mm
      bcf: formData.bcf ? parseInt(formData.bcf) : undefined,
      mf: formData.mf ? parseInt(formData.mf) : undefined,
      conduta: formData.conduta.length > 0 ? JSON.stringify(formData.conduta) : undefined,
      condutaComplementacao: formData.condutaComplementacao || undefined,
      observacoes: formData.observacoes || undefined,
    };

    if (consultaEditando) {
      updateMutation.mutate({ id: consultaEditando, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (consulta: any) => {
    setConsultaEditando(consulta.id);
    let condutaArray: string[] = [];
    if (consulta.conduta) {
      try {
        condutaArray = JSON.parse(consulta.conduta);
      } catch {
        condutaArray = [];
      }
    }
    setFormData({
      dataConsulta: new Date(consulta.dataConsulta).toISOString().split('T')[0],
      peso: consulta.peso ? String(consulta.peso / 1000) : "",
      pressaoArterial: consulta.pressaoArterial || "",
      alturaUterina: consulta.alturaUterina === -1 ? "nao_palpavel" : (consulta.alturaUterina ? String(consulta.alturaUterina / 10) : ""),
      bcf: consulta.bcf ? String(consulta.bcf) : "",
      mf: consulta.mf ? String(consulta.mf) : "",
      conduta: condutaArray,
      condutaComplementacao: consulta.condutaComplementacao || "",
      observacoes: consulta.observacoes || "",
    });
    setMostrarFormulario(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja excluir esta consulta?")) {
      deleteMutation.mutate({ id });
    }
  };

  const calcularIG = (dataConsulta: string) => {
    if (!gestante?.dum) return null;
    
    const dum = new Date(gestante.dum);
    const consulta = new Date(dataConsulta);
    const diffMs = consulta.getTime() - dum.getTime();
    const totalDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const semanas = Math.floor(totalDias / 7);
    const dias = totalDias % 7;
    
    return { semanas, dias };
  };

  const calcularIGPorUS = (dataConsulta: string) => {
    if (!gestante?.dataUltrassom || !gestante?.igUltrassomSemanas) return null;
    
    const ultrassom = new Date(gestante.dataUltrassom);
    const consulta = new Date(dataConsulta);
    const diffMs = consulta.getTime() - ultrassom.getTime();
    const diasDesdeUS = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    const totalDiasUS = (gestante.igUltrassomSemanas * 7) + (gestante.igUltrassomDias || 0) + diasDesdeUS;
    const semanas = Math.floor(totalDiasUS / 7);
    const dias = totalDiasUS % 7;
    
    return { semanas, dias };
  };

  const formatarData = (data: Date | string) => {
    // Adicionar T12:00:00 para evitar problemas de fuso horário
    const dataStr = typeof data === 'string' ? data : data.toISOString().split('T')[0];
    const d = new Date(dataStr + 'T12:00:00');
    return d.toLocaleDateString('pt-BR');
  };

  // Calcula data para uma semana específica pelo Ultrassom
  const calcularDataPorUS = (semanas: number, dias: number = 0) => {
    if (!gestante?.dataUltrassom || gestante?.igUltrassomSemanas === null || gestante?.igUltrassomDias === null) return null;
    const dataUS = new Date(gestante.dataUltrassom);
    const igUltrassomDias = (gestante.igUltrassomSemanas * 7) + gestante.igUltrassomDias;
    const diasDesdeUS = semanas * 7 + dias - igUltrassomDias;
    const dataAlvo = new Date(dataUS);
    dataAlvo.setDate(dataAlvo.getDate() + diasDesdeUS);
    return dataAlvo;
  };

  const copiarTexto = (texto: string) => {
    navigator.clipboard.writeText(texto);
    toast.success("Copiado para a área de transferência!");
  };

  const marcos = [
    {
      titulo: "Concepção",
      icon: Baby,
      semanas: 2,
      dias: 0,
      color: "bg-purple-100 text-purple-700 border-purple-300",
    },
    {
      titulo: "Morfológico 1º Tri",
      icon: Activity,
      semanas: [11, 13],
      dias: [5, 3],
      color: "bg-emerald-100 text-emerald-700 border-emerald-300",
      isRange: true,
    },
    {
      titulo: "13 Semanas",
      icon: CheckCircle2,
      semanas: 13,
      dias: 0,
      color: "bg-blue-100 text-blue-700 border-blue-300",
    },
    {
      titulo: "Morfológico 2º Tri",
      icon: Activity,
      semanas: [20, 24],
      dias: [0, 6],
      color: "bg-cyan-100 text-cyan-700 border-cyan-300",
      isRange: true,
    },
    {
      titulo: "Vacina dTpa",
      icon: Syringe,
      semanas: 27,
      dias: 0,
      color: "bg-orange-100 text-orange-700 border-orange-300",
    },
    {
      titulo: "Vacina Bronquiolite",
      icon: Syringe,
      semanas: [32, 36],
      dias: [0, 0],
      color: "bg-yellow-100 text-yellow-700 border-yellow-300",
      isRange: true,
    },
    {
      titulo: "Termo Precoce",
      icon: Calendar,
      semanas: 37,
      dias: 0,
      color: "bg-cyan-100 text-cyan-700 border-cyan-300",
    },
    {
      titulo: "Termo Completo",
      icon: Calendar,
      semanas: 39,
      dias: 0,
      color: "bg-green-100 text-green-700 border-green-300",
    },
    {
      titulo: "DPP (40 semanas)",
      icon: Calendar,
      semanas: 40,
      dias: 0,
      color: "bg-rose-100 text-rose-700 border-rose-300",
    },
  ];

  return (
    <GestantesLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/dashboard")}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">Cartão de Pré-natal</h2>
            <p className="text-muted-foreground">Registre e acompanhe as consultas pré-natais</p>
          </div>
        </div>

        {/* Seleção de Gestante */}
        <Card>
          <CardHeader>
            <CardTitle>Selecionar Gestante</CardTitle>
            <CardDescription>Escolha a gestante para visualizar ou registrar consultas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>Selecionar Gestante</Label>
              <AutocompleteSelect
                options={gestantes?.slice().sort((a: any, b: any) => a.nome.localeCompare(b.nome)) || []}
                value={gestanteSelecionada?.toString() || ""}
                onChange={(value) => {
                  setGestanteSelecionada(parseInt(value));
                  setMostrarFormulario(false);
                  resetForm();
                }}
                placeholder="Digite o nome da gestante..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Informações da Gestante */}
        {gestante && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Dados da Gestante
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-muted-foreground text-sm">Nome Completo</Label>
                    <p className="font-semibold text-lg">{gestante.nome}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm">Gesta</Label>
                    <p className="font-medium">{gestante.gesta || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm">Partos Normais</Label>
                    <p className="font-medium">{gestante.partosNormais || "-"}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label className="text-muted-foreground text-sm">DPP pela DUM</Label>
                    <p className="font-semibold text-lg">{gestante.calculado?.dpp ? formatarData(gestante.calculado.dpp) : "-"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm">Para</Label>
                    <p className="font-medium">{gestante.para || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm">Cesáreas</Label>
                    <p className="font-medium">{gestante.cesareas || "-"}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label className="text-muted-foreground text-sm">DPP pelo Ultrassom</Label>
                    <p className="font-semibold text-lg">{gestante.calculado?.dppUS ? formatarData(gestante.calculado.dppUS) : "-"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm">Abortos</Label>
                    <p className="font-medium">{gestante.abortos || "-"}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Botão Nova Consulta */}
        {gestanteSelecionada && !mostrarFormulario && (
          <Button onClick={() => setMostrarFormulario(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Consulta
          </Button>
        )}

        {/* Formulário de Consulta */}
        {mostrarFormulario && (
          <Card>
            <CardHeader>
              <CardTitle>{consultaEditando ? "Editar Consulta" : "Nova Consulta"}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Data da Consulta</Label>
                    <Input
                      type="date"
                      value={formData.dataConsulta}
                      onChange={(e) => setFormData({ ...formData, dataConsulta: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>Idade Gestacional</Label>
                    <div className="bg-muted p-3 rounded-md space-y-1">
                      <p className="text-sm">
                        <span className="font-medium">DUM:</span>{" "}
                        {(() => {
                          const ig = calcularIG(formData.dataConsulta);
                          return ig ? `${ig.semanas} semanas e ${ig.dias} dias` : "-";
                        })()}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Ultrassom:</span>{" "}
                        {(() => {
                          const igUS = calcularIGPorUS(formData.dataConsulta);
                          return igUS ? `${igUS.semanas} semanas e ${igUS.dias} dias` : "-";
                        })()}
                      </p>
                    </div>
                  </div>
                  <div>
                    <Label>Peso (kg)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.peso}
                      onChange={(e) => setFormData({ ...formData, peso: e.target.value })}
                      placeholder="Ex: 65.5"
                    />
                  </div>
                  <div>
                    <Label>Pressão Arterial</Label>
                    <Input
                      type="text"
                      value={formData.pressaoArterial}
                      onChange={(e) => setFormData({ ...formData, pressaoArterial: e.target.value })}
                      placeholder="Ex: 120/80"
                    />
                  </div>
                  <div>
                    <Label>Altura Uterina (cm)</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      value={formData.alturaUterina}
                      onChange={(e) => setFormData({ ...formData, alturaUterina: e.target.value })}
                    >
                      <option value="">Selecione...</option>
                      <option value="nao_palpavel">Útero não palpável</option>
                      {Array.from({ length: 31 }, (_, i) => i + 10).map(cm => (
                        <option key={cm} value={String(cm)}>{cm} cm</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>BCF</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      value={formData.bcf}
                      onChange={(e) => setFormData({ ...formData, bcf: e.target.value })}
                    >
                      <option value="">Selecione...</option>
                      <option value="1">Sim</option>
                      <option value="0">Não</option>
                    </select>
                  </div>
                  <div>
                    <Label>MF (Movimento Fetal)</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      value={formData.mf}
                      onChange={(e) => setFormData({ ...formData, mf: e.target.value })}
                    >
                      <option value="">Selecione...</option>
                      <option value="1">Sim</option>
                      <option value="0">Não</option>
                    </select>
                  </div>
                </div>
                
                {/* Seção de Conduta com Checkboxes */}
                <div className="border rounded-lg p-4 bg-muted/30">
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-base font-semibold">Conduta:</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setMostrarAddConduta(!mostrarAddConduta)}
                      className="text-xs"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Adicionar Conduta
                    </Button>
                  </div>

                  {/* Formulário para adicionar nova conduta */}
                  {mostrarAddConduta && (
                    <div className="mb-4 p-3 bg-background rounded-lg border flex gap-2">
                      <Input
                        value={novaConduta}
                        onChange={(e) => setNovaConduta(e.target.value)}
                        placeholder="Nome da nova conduta..."
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          if (novaConduta.trim()) {
                            createCondutaMutation.mutate({ nome: novaConduta.trim() });
                          }
                        }}
                        disabled={!novaConduta.trim() || createCondutaMutation.isPending}
                      >
                        Salvar
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setNovaConduta("");
                          setMostrarAddConduta(false);
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {/* Condutas predefinidas */}
                    {OPCOES_CONDUTA.map((opcao) => (
                      <label
                        key={opcao}
                        className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-2 rounded transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={formData.conduta.includes(opcao)}
                          onChange={() => toggleConduta(opcao)}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <span className="text-sm text-muted-foreground">{opcao}</span>
                      </label>
                    ))}

                    {/* Condutas personalizadas */}
                    {condutasPersonalizadas && condutasPersonalizadas.length > 0 && (
                      <>
                        <div className="col-span-full border-t my-2 pt-2">
                          <span className="text-xs text-muted-foreground font-medium">Condutas Personalizadas:</span>
                        </div>
                        {condutasPersonalizadas.map((conduta) => (
                          <label
                            key={`custom-${conduta.id}`}
                            className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-2 rounded transition-colors group"
                          >
                            <input
                              type="checkbox"
                              checked={formData.conduta.includes(conduta.nome)}
                              onChange={() => toggleConduta(conduta.nome)}
                              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <span className="text-sm text-muted-foreground flex-1">{conduta.nome}</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (confirm(`Remover conduta "${conduta.nome}"?`)) {
                                  deleteCondutaMutation.mutate({ id: conduta.id });
                                }
                              }}
                              className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive/80 transition-opacity"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </label>
                        ))}
                      </>
                    )}
                  </div>
                </div>

                {/* Conduta Complementação */}
                <div>
                  <Label>Conduta (complementação):</Label>
                  <Textarea
                    value={formData.condutaComplementacao}
                    onChange={(e) => setFormData({ ...formData, condutaComplementacao: e.target.value })}
                    placeholder="Complementação da conduta..."
                    rows={2}
                  />
                </div>

                <div>
                  <Label>Observações</Label>
                  <Textarea
                    value={formData.observacoes}
                    onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                    placeholder="Observações da consulta..."
                    rows={3}
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {(createMutation.isPending || updateMutation.isPending) && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {(createMutation.isPending || updateMutation.isPending) 
                      ? 'Salvando...' 
                      : (consultaEditando ? "Atualizar" : "Salvar")}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Marcos Importantes da Gestação */}
        {gestante && gestante.dataUltrassom && (
          <Card>
            <CardHeader>
              <CardTitle>Marcos Importantes da Gestação</CardTitle>
              <CardDescription>Calculados pela data do Ultrassom</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {marcos.map((marco, idx) => {
                  const Icon = marco.icon;
                  let dataInicio = null;
                  let dataFim = null;
                  let textoParaCopiar = "";

                  if (marco.isRange && Array.isArray(marco.semanas) && Array.isArray(marco.dias)) {
                    dataInicio = calcularDataPorUS(marco.semanas[0], marco.dias[0]);
                    dataFim = calcularDataPorUS(marco.semanas[1], marco.dias[1]);
                    // Formato: "DD/MM a DD/MM/AAAA"
                    if (dataInicio && dataFim) {
                      const diaInicio = String(dataInicio.getDate()).padStart(2, '0');
                      const mesInicio = String(dataInicio.getMonth() + 1).padStart(2, '0');
                      const diaFim = String(dataFim.getDate()).padStart(2, '0');
                      const mesFim = String(dataFim.getMonth() + 1).padStart(2, '0');
                      const anoFim = dataFim.getFullYear();
                      textoParaCopiar = `${diaInicio}/${mesInicio} a ${diaFim}/${mesFim}/${anoFim}`;
                    } else {
                      textoParaCopiar = '-';
                    }
                  } else if (typeof marco.semanas === 'number' && typeof marco.dias === 'number') {
                    dataInicio = calcularDataPorUS(marco.semanas, marco.dias);
                    textoParaCopiar = dataInicio ? dataInicio.toLocaleDateString('pt-BR') : '-';
                  }

                  return (
                    <Card key={idx} className={`border-2 ${marco.color} relative`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Icon className="h-5 w-5" />
                            <span className="font-semibold text-sm">{marco.titulo}</span>
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={() => copiarTexto(textoParaCopiar)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                        {marco.isRange ? (
                          <div className="text-sm space-y-1">
                            <div>{dataInicio ? dataInicio.toLocaleDateString('pt-BR') : '-'} a</div>
                            <div>{dataFim ? dataFim.toLocaleDateString('pt-BR') : '-'}</div>
                          </div>
                        ) : (
                          <div className="text-sm font-medium">
                            {dataInicio ? dataInicio.toLocaleDateString('pt-BR') : '-'}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Histórico de Consultas */}
        {gestanteSelecionada && consultas && consultas.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Consultas</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>IG</TableHead>
                    <TableHead>Peso</TableHead>
                    <TableHead>PA</TableHead>
                    <TableHead>AU</TableHead>
                    <TableHead>BCF</TableHead>
                    <TableHead>MF</TableHead>
                    <TableHead>Conduta</TableHead>
                    <TableHead>Observações</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {consultas.map((consulta: any) => {
                    const igDUM = calcularIG(consulta.dataConsulta);
                    const igUS = gestante?.dataUltrassom ? calcularIGPorUS(consulta.dataConsulta) : null;
                    return (
                      <TableRow key={consulta.id}>
                        <TableCell>{formatarData(consulta.dataConsulta)}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>I.G. DUM: {igDUM ? `${igDUM.semanas}s ${igDUM.dias}d` : "-"}</div>
                            {igUS && <div>I.G. US: {igUS.semanas}s {igUS.dias}d</div>}
                          </div>
                        </TableCell>
                        <TableCell>{consulta.peso ? `${(consulta.peso / 1000).toFixed(1)} kg` : "-"}</TableCell>
                        <TableCell>{consulta.pressaoArterial || "-"}</TableCell>
                        <TableCell>
                          {consulta.alturaUterina === -1 ? (
                            <span className="text-muted-foreground italic">Útero não palpável</span>
                          ) : consulta.alturaUterina ? `${(consulta.alturaUterina / 10).toFixed(0)} cm` : "-"}
                        </TableCell>
                        <TableCell>
                          {consulta.bcf === 1 ? (
                            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">Sim</span>
                          ) : "-"}
                        </TableCell>
                        <TableCell>
                          {consulta.mf === 1 ? (
                            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">Sim</span>
                          ) : "-"}
                        </TableCell>
                        <TableCell>
                          {(() => {
                            if (!consulta.conduta) return "-";
                            try {
                              const condutas = JSON.parse(consulta.conduta);
                              if (condutas.length === 0) return "-";
                              return (
                                <div className="space-y-1">
                                  {condutas.map((c: string, idx: number) => (
                                    <span key={idx} className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 mr-1">
                                      {c}
                                    </span>
                                  ))}
                                  {consulta.condutaComplementacao && (
                                    <div className="text-xs text-muted-foreground mt-1">
                                      {consulta.condutaComplementacao}
                                    </div>
                                  )}
                                </div>
                              );
                            } catch {
                              return "-";
                            }
                          })()}
                        </TableCell>
                        <TableCell>{consulta.observacoes || "-"}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleEdit(consulta)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleDelete(consulta.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Gráfico de Peso */}
        {gestante && consultas && consultas.length > 0 && gestante.altura && gestante.pesoInicial && (
          <Card>
            <CardHeader>
              <CardTitle>Evolução de Peso Gestacional</CardTitle>
              <CardDescription>Acompanhamento do ganho de peso baseado no IMC pré-gestacional</CardDescription>
            </CardHeader>
            <CardContent>
              <GraficoPeso
                consultas={consultas.map((c: any) => {
                  // Priorizar IG pelo Ultrassom, usar DUM como fallback
                  const igUS = calcularIGPorUS(c.dataConsulta);
                  const igDUM = calcularIG(c.dataConsulta);
                  const ig = igUS || igDUM; // Prioriza US
                  return {
                    data: c.dataConsulta,
                    peso: c.peso / 1000, // converter gramas para kg
                    igSemanas: ig?.semanas || 0,
                  };
                })}
                altura={gestante.altura}
                pesoInicial={gestante.pesoInicial / 1000} // converter gramas para kg
                metodoCalculo={
                  gestante?.dataUltrassom && gestante?.igUltrassomSemanas !== null 
                    ? 'US' 
                    : 'DUM'
                }
              />
            </CardContent>
          </Card>
        )}

        {/* Botão Gerar PDF */}
        {gestante && (
          <div className="flex justify-end mt-6">
            <Button
              onClick={handleGerarPDF}
              disabled={isGerandoPDF}
              size="lg"
              className="bg-[#8B4049] hover:bg-[#6d3239]"
            >
              {isGerandoPDF ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Gerando PDF...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
                  </svg>
                  Gerar Cartão Pré-natal em PDF
                </>
              )}
            </Button>
          </div>
        )}

        {/* Componente invisível para geração de PDF */}

        {gestante && (
          <CartaoPrenatalPDF
            ref={pdfRef}
            gestante={gestante}
            consultas={consultas || []}
            marcos={calcularMarcos()}
            ultrassons={ultrassons || []}
            exames={exames || []}
          />
        )}
      </div>
    </GestantesLayout>
  );
}
