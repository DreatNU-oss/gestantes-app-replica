import GestantesLayout from "@/components/GestantesLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, Calendar, FileText, Plus, Trash2, Edit2, Download, Copy, Baby, Activity, Syringe, CheckCircle2 } from "lucide-react";
import { useLocation } from "wouter";
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
  
  const getDataHoje = () => {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  };

  const [gestanteSelecionada, setGestanteSelecionada] = useState<number | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [consultaEditando, setConsultaEditando] = useState<number | null>(null);
  const [isGerandoPDF, setIsGerandoPDF] = useState(false);
  const pdfRef = useRef<HTMLDivElement>(null);


  const [formData, setFormData] = useState({
    dataConsulta: getDataHoje(),
    peso: "",
    pressaoArterial: "",
    alturaUterina: "",
    bcf: "",
    mf: "",
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

  const handleImprimirComGrafico = async () => {
    if (!gestante) {
      toast.error('Selecione uma gestante primeiro');
      return;
    }

    try {
      // Capturar gráfico como imagem
      const graficoElement = document.querySelector('.recharts-wrapper');
      if (!graficoElement) {
        toast.error('Gráfico não encontrado');
        return;
      }

      const graficoCanvas = await html2canvas(graficoElement as HTMLElement, {
        scale: 2,
        backgroundColor: '#ffffff'
      });
      const graficoImg = graficoCanvas.toDataURL('image/png');

      // Calcular marcos importantes
      const marcosCalculados = [];
      if (gestante.calculado?.dppUS) {
        const dppUS = new Date(gestante.calculado.dppUS);
        const concepcao = new Date(dppUS);
        concepcao.setDate(concepcao.getDate() - 280);
        
        marcosCalculados.push(
          { titulo: 'Concepção', dataFormatada: concepcao.toLocaleDateString('pt-BR'), cor: '#d8b4fe' },
          { titulo: 'Morfológico 1º Tri (11-13s)', dataFormatada: `${new Date(concepcao.getTime() + 77*24*60*60*1000).toLocaleDateString('pt-BR').substring(0, 5)} a ${new Date(concepcao.getTime() + 98*24*60*60*1000).toLocaleDateString('pt-BR').substring(0, 5)}`, cor: '#6ee7b7' },
          { titulo: '13 Semanas', dataFormatada: new Date(concepcao.getTime() + 91*24*60*60*1000).toLocaleDateString('pt-BR'), cor: '#93c5fd' },
          { titulo: 'Morfológico 2º Tri (20-24s)', dataFormatada: `${new Date(concepcao.getTime() + 140*24*60*60*1000).toLocaleDateString('pt-BR').substring(0, 5)} a ${new Date(concepcao.getTime() + 168*24*60*60*1000).toLocaleDateString('pt-BR').substring(0, 5)}`, cor: '#67e8f9' },
          { titulo: 'Vacina dTpa (27s)', dataFormatada: new Date(concepcao.getTime() + 189*24*60*60*1000).toLocaleDateString('pt-BR'), cor: '#fdba74' },
          { titulo: 'Vacina Bronquiolite (32-36s)', dataFormatada: `${new Date(concepcao.getTime() + 224*24*60*60*1000).toLocaleDateString('pt-BR').substring(0, 5)} a ${new Date(concepcao.getTime() + 252*24*60*60*1000).toLocaleDateString('pt-BR').substring(0, 5)}`, cor: '#fde047' },
          { titulo: 'Termo Precoce (37s)', dataFormatada: new Date(concepcao.getTime() + 259*24*60*60*1000).toLocaleDateString('pt-BR'), cor: '#67e8f9' },
          { titulo: 'Termo Completo (39s)', dataFormatada: new Date(concepcao.getTime() + 273*24*60*60*1000).toLocaleDateString('pt-BR'), cor: '#86efac' },
          { titulo: 'DPP (40 semanas)', dataFormatada: dppUS.toLocaleDateString('pt-BR'), cor: '#fda4af' }
        );
      }

      // Gerar HTML completo
      const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Cartão de Pré-natal - ${gestante.nomeCompleto}</title>
  <style>
    @media print {
      @page { margin: 1cm; }
      body { margin: 0; }
    }
    body {
      font-family: Arial, sans-serif;
      max-width: 210mm;
      margin: 0 auto;
      padding: 20px;
      background: white;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .logo {
      max-width: 200px;
      margin-bottom: 20px;
    }
    h1 {
      color: #8B4049;
      font-size: 24px;
      margin: 10px 0;
    }
    h2 {
      color: #8B4049;
      font-size: 18px;
      margin: 20px 0 10px 0;
      border-bottom: 2px solid #8B4049;
      padding-bottom: 5px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 20px;
    }
    .info-item {
      padding: 8px;
      background: #f5f5f5;
      border-radius: 4px;
    }
    .info-label {
      font-weight: bold;
      color: #666;
      font-size: 12px;
    }
    .info-value {
      color: #333;
      font-size: 14px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 8px;
      text-align: left;
      font-size: 12px;
    }
    th {
      background-color: #8B4049;
      color: white;
    }
    .marcos-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin: 20px 0;
    }
    .marco-item {
      padding: 10px;
      border-radius: 4px;
      font-size: 12px;
    }
    .marco-titulo {
      font-weight: bold;
      margin-bottom: 5px;
    }
    .grafico {
      margin: 20px 0;
      text-align: center;
      page-break-before: always;
    }
    .grafico img {
      max-width: 100%;
      height: auto;
    }
  </style>
</head>
<body>
  <div class="header">
    <img src="/logo-horizontal.png" alt="Mais Mulher" class="logo" />
    <h1>Cartão de Pré-natal</h1>
  </div>

  <h2>Dados da Gestante</h2>
  <div class="info-grid">
    <div class="info-item">
      <div class="info-label">Nome Completo</div>
      <div class="info-value">${gestante.nomeCompleto}</div>
    </div>
    <div class="info-item">
      <div class="info-label">Idade</div>
      <div class="info-value">${gestante.calculado.idade || '-'} anos</div>
    </div>
    <div class="info-item">
      <div class="info-label">Telefone</div>
      <div class="info-value">${gestante.telefone || '-'}</div>
    </div>
    <div class="info-item">
      <div class="info-label">Histórico Obstétrico</div>
      <div class="info-value">G${gestante.gesta}P${gestante.para}${gestante.cesareas > 0 ? `(${gestante.cesareas})` : ''}A${gestante.abortos}</div>
    </div>
    <div class="info-item">
      <div class="info-label">DPP pela DUM</div>
      <div class="info-value">${gestante.calculado.dpp ? new Date(gestante.calculado.dpp).toLocaleDateString('pt-BR') : '-'}</div>
    </div>
    <div class="info-item">
      <div class="info-label">DPP pelo Ultrassom</div>
      <div class="info-value">${gestante.calculado.dppUS ? new Date(gestante.calculado.dppUS).toLocaleDateString('pt-BR') : '-'}</div>
    </div>
  </div>

  <h2>Histórico de Consultas</h2>
  <table>
    <thead>
      <tr>
        <th>Data</th>
        <th>IG</th>
        <th>Peso</th>
        <th>PA</th>
        <th>AU</th>
        <th>BCF</th>
        <th>MF</th>
      </tr>
    </thead>
    <tbody>
      ${(consultas || []).map(c => `
        <tr>
          <td>${new Date(c.dataConsulta).toLocaleDateString('pt-BR')}</td>
          <td>${c.igSemanas ? `${c.igSemanas}s${c.igDias || 0}d` : '-'}</td>
          <td>${c.peso ? (c.peso / 1000).toFixed(1) + ' kg' : '-'}</td>
          <td>${c.pressaoArterial || '-'}</td>
          <td>${c.alturaUterina ? (c.alturaUterina / 10).toFixed(1) + ' cm' : '-'}</td>
          <td>${c.bcf ? 'Sim' : '-'}</td>
          <td>${c.mf ? 'Sim' : '-'}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <h2>Marcos Importantes da Gestação</h2>
  <div class="marcos-grid">
    ${marcosCalculados.map(marco => `
      <div class="marco-item" style="background-color: ${marco.cor}33; border-left: 4px solid ${marco.cor};">
        <div class="marco-titulo">${marco.titulo}</div>
        <div>${marco.dataFormatada}</div>
      </div>
    `).join('')}
  </div>

  <div class="grafico">
    <h2>Evolução de Peso Gestacional</h2>
    <img src="${graficoImg}" alt="Gráfico de Evolução de Peso" />
  </div>

  <script>
    // Imprimir automaticamente ao carregar
    window.onload = function() {
      window.print();
    };
  </script>
</body>
</html>
      `;

      // Abrir em nova aba
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(html);
        newWindow.document.close();
      } else {
        toast.error('Bloqueador de pop-ups impediu a abertura da página');
      }
    } catch (error: any) {
      console.error('Erro ao gerar página:', error);
      toast.error(`Erro ao gerar página: ${error.message}`);
    }
  };

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
          
          // Texto do marco (branco para contraste)
          pdf.setTextColor(255, 255, 255);
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
      if (exames && exames.length > 0) {
        if (y > 250) {
          pdf.addPage();
          y = 20;
        }
        
        pdf.setFontSize(14);
        pdf.setTextColor(139, 64, 73);
        pdf.text('Exames Laboratoriais', 20, y);
        y += 10;
        
        // Cabeçalho da tabela
        pdf.setFontSize(9);
        pdf.setTextColor(0, 0, 0);
        pdf.setFont(undefined, 'bold');
        pdf.text('Data', 20, y);
        pdf.text('Tipo de Exame', 50, y);
        pdf.text('IG', 120, y);
        pdf.text('Resultado', 140, y);
        y += 5;
        
        // Linha separadora
        pdf.setDrawColor(139, 64, 73);
        pdf.line(20, y, 190, y);
        y += 5;
        
        pdf.setFont(undefined, 'normal');
        
        exames.forEach((exame: any) => {
          if (y > 270) {
            pdf.addPage();
            y = 20;
            // Repetir cabeçalho na nova página
            pdf.setFont(undefined, 'bold');
            pdf.text('Data', 20, y);
            pdf.text('Tipo de Exame', 50, y);
            pdf.text('IG', 120, y);
            pdf.text('Resultado', 140, y);
            y += 5;
            pdf.line(20, y, 190, y);
            y += 5;
            pdf.setFont(undefined, 'normal');
          }
          
          const dataExame = exame.dataExame ? new Date(exame.dataExame).toLocaleDateString('pt-BR') : '-';
          const ig = exame.igSemanas !== null && exame.igDias !== null ? `${exame.igSemanas}s${exame.igDias}d` : '-';
          const resultado = exame.resultado || '-';
          
          pdf.text(dataExame, 20, y);
          pdf.text(exame.tipoExame, 50, y);
          pdf.text(ig, 120, y);
          pdf.text(resultado.substring(0, 30), 140, y); // Limitar tamanho do resultado
          y += 5;
        });
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
          if (us.dados) {
            const dados = typeof us.dados === 'string' ? JSON.parse(us.dados) : us.dados;
            if (dados.dpp) dadosTexto = `DPP: ${dados.dpp}`;
            else if (dados.pesoFetal) dadosTexto = `Peso: ${dados.pesoFetal}g`;
            else if (dados.bcf) dadosTexto = `BCF: ${dados.bcf}bpm`;
          }
          
          pdf.text(dataExame, 20, y);
          pdf.text(tipo.substring(0, 20), 50, y);
          pdf.text(ig, 100, y);
          pdf.text(dadosTexto.substring(0, 35), 120, y);
          y += 5;
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
      observacoes: "",
    });
    setMostrarFormulario(false);
    setConsultaEditando(null);
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
    setFormData({
      dataConsulta: new Date(consulta.dataConsulta).toISOString().split('T')[0],
      peso: consulta.peso ? String(consulta.peso / 1000) : "",
      pressaoArterial: consulta.pressaoArterial || "",
      alturaUterina: consulta.alturaUterina === -1 ? "nao_palpavel" : (consulta.alturaUterina ? String(consulta.alturaUterina / 10) : ""),
      bcf: consulta.bcf ? String(consulta.bcf) : "",
      mf: consulta.mf ? String(consulta.mf) : "",
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
    const d = new Date(data);
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
                  <Button type="submit">
                    {consultaEditando ? "Atualizar" : "Salvar"}
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
        {gestante && consultas.length > 0 && gestante.altura && gestante.pesoInicial && (
          <Card id="grafico-peso-gestacional">
            <CardHeader>
              <CardTitle>Evolução de Peso Gestacional</CardTitle>
              <CardDescription>Acompanhamento do ganho de peso baseado no IMC pré-gestacional</CardDescription>
            </CardHeader>
            <CardContent>
              <GraficoPeso
                consultas={consultas.map((c: any) => {
                  const igDUM = calcularIG(c.dataConsulta);
                  return {
                    data: c.dataConsulta,
                    peso: c.peso / 1000, // converter gramas para kg
                    igSemanas: igDUM?.semanas || 0,
                  };
                })}
                altura={gestante.altura}
                pesoInicial={gestante.pesoInicial / 1000} // converter gramas para kg
              />
            </CardContent>
          </Card>
        )}

        {/* Botão Gerar PDF */}
        {gestante && (
          <div className="flex justify-end mt-6">
            <div className="flex gap-3">
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
              
              <Button
                onClick={handleImprimirComGrafico}
                disabled={isGerandoPDF}
                size="lg"
                variant="outline"
                className="border-[#8B4049] text-[#8B4049] hover:bg-[#8B4049] hover:text-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
                </svg>
                Imprimir Cartão com Gráfico
              </Button>
            </div>
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
