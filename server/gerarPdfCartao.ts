import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import path from "path";
import fs from "fs";

interface DadosGestante {
  nome: string;
  idade: number | null;
  dum: string | null;
  dppDUM: string | null;
  dppUS: string | null;
  gesta: number | null;
  para: number | null;
  abortos: number | null;
  partosNormais: number | null;
  cesareas: number | null;
}

interface Consulta {
  dataConsulta: string;
  igDUM: string;
  igUS: string | null;
  peso: number | null;
  pa: string | null;
  au: number | null;
  bcf: number | null;
  mf: number | null;
  conduta: string | null;
  condutaComplementacao: string | null;
  observacoes: string | null;
}

interface Marco {
  titulo: string;
  data: string;
  periodo: string;
}

interface Ultrassom {
  data: string;
  ig: string;
  tipo: string;
  observacoes: string | null;
}

interface Exame {
  tipo: string;
  data: string;
  resultado: string;
  trimestre: number;
}

interface DadosPDF {
  gestante: DadosGestante;
  consultas: Consulta[];
  marcos: Marco[];
  ultrassons: Ultrassom[];
  exames: Exame[];
}

export async function gerarPdfCartaoPrenatal(dados: DadosPDF): Promise<Buffer> {
  const logoPath = path.join(process.cwd(), "client/public/logo-horizontal.png");
  const logoBase64 = fs.existsSync(logoPath)
    ? `data:image/png;base64,${fs.readFileSync(logoPath).toString("base64")}`
    : "";

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cartão Pré-natal - ${dados.gestante.nome}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 11pt;
      line-height: 1.4;
      color: #333;
      padding: 20mm;
    }
    
    .header {
      text-align: center;
      margin-bottom: 20px;
      padding-bottom: 15px;
      border-bottom: 3px solid #8B4049;
    }
    
    .logo {
      max-width: 200px;
      margin-bottom: 10px;
    }
    
    h1 {
      color: #8B4049;
      font-size: 20pt;
      margin-bottom: 5px;
    }
    
    h2 {
      color: #8B4049;
      font-size: 14pt;
      margin-top: 20px;
      margin-bottom: 10px;
      padding-bottom: 5px;
      border-bottom: 2px solid #E8D4D6;
    }
    
    h3 {
      color: #6d3239;
      font-size: 12pt;
      margin-top: 15px;
      margin-bottom: 8px;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin-bottom: 15px;
    }
    
    .info-item {
      background: #f9f9f9;
      padding: 8px;
      border-radius: 4px;
    }
    
    .info-label {
      font-weight: bold;
      color: #666;
      font-size: 9pt;
      display: block;
      margin-bottom: 2px;
    }
    
    .info-value {
      color: #333;
      font-size: 11pt;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 15px;
      font-size: 9pt;
    }
    
    th {
      background: #8B4049;
      color: white;
      padding: 8px 5px;
      text-align: left;
      font-weight: 600;
    }
    
    td {
      padding: 6px 5px;
      border-bottom: 1px solid #ddd;
    }
    
    tr:nth-child(even) {
      background: #f9f9f9;
    }
    
    .page-break {
      page-break-after: always;
    }
    
    .footer {
      margin-top: 30px;
      padding-top: 15px;
      border-top: 2px solid #E8D4D6;
      text-align: center;
      font-size: 9pt;
      color: #666;
    }
    
    @media print {
      body {
        padding: 10mm;
      }
    }
  </style>
</head>
<body>
  <!-- Cabeçalho -->
  <div class="header">
    ${logoBase64 ? `<img src="${logoBase64}" alt="Logo Clínica" class="logo" />` : ""}
    <h1>Cartão de Pré-natal</h1>
    <p style="color: #666;">Clínica Mais Mulher</p>
  </div>

  <!-- Dados da Gestante -->
  <h2>Dados da Gestante</h2>
  <div class="info-grid">
    <div class="info-item">
      <span class="info-label">Nome Completo</span>
      <span class="info-value">${dados.gestante.nome}</span>
    </div>
    <div class="info-item">
      <span class="info-label">Idade</span>
      <span class="info-value">${dados.gestante.idade || "-"} anos</span>
    </div>
    <div class="info-item">
      <span class="info-label">DUM</span>
      <span class="info-value">${dados.gestante.dum ? new Date(dados.gestante.dum).toLocaleDateString("pt-BR") : "-"}</span>
    </div>
    <div class="info-item">
      <span class="info-label">DPP pela DUM</span>
      <span class="info-value">${dados.gestante.dppDUM || "-"}</span>
    </div>
    <div class="info-item">
      <span class="info-label">DPP pelo US</span>
      <span class="info-value">${dados.gestante.dppUS || "-"}</span>
    </div>
    <div class="info-item">
      <span class="info-label">Gesta</span>
      <span class="info-value">${dados.gestante.gesta || "-"}</span>
    </div>
    <div class="info-item">
      <span class="info-label">Para</span>
      <span class="info-value">${dados.gestante.para || "-"}</span>
    </div>
    <div class="info-item">
      <span class="info-label">Abortos</span>
      <span class="info-value">${dados.gestante.abortos || "-"}</span>
    </div>
    <div class="info-item">
      <span class="info-label">Partos Normais</span>
      <span class="info-value">${dados.gestante.partosNormais || "-"}</span>
    </div>
    <div class="info-item">
      <span class="info-label">Cesáreas</span>
      <span class="info-value">${dados.gestante.cesareas || "-"}</span>
    </div>
  </div>

  <!-- Consultas Pré-natais -->
  ${
    dados.consultas.length > 0
      ? `
  <h2>Consultas Pré-natais</h2>
  <table>
    <thead>
      <tr>
        <th>Data</th>
        <th>IG DUM</th>
        <th>IG US</th>
        <th>Peso (kg)</th>
        <th>PA</th>
        <th>AU (cm)</th>
        <th>BCF</th>
        <th>MF</th>
        <th>Conduta</th>
        <th>Observações</th>
      </tr>
    </thead>
    <tbody>
      ${dados.consultas
        .map(
          (c) => {
            let condutaStr = "-";
            if (c.conduta) {
              try {
                const condutas = JSON.parse(c.conduta);
                if (condutas.length > 0) {
                  condutaStr = condutas.join(", ");
                  if (c.condutaComplementacao) {
                    condutaStr += " | " + c.condutaComplementacao;
                  }
                }
              } catch {
                condutaStr = "-";
              }
            }
            return `
        <tr>
          <td>${c.dataConsulta}</td>
          <td>${c.igDUM}</td>
          <td>${c.igUS || "-"}</td>
          <td>${c.peso ? (c.peso / 1000).toFixed(1) : "-"}</td>
          <td>${c.pa || "-"}</td>
          <td>${c.au || "-"}</td>
          <td>${c.bcf === 1 ? "Sim" : c.bcf === 0 ? "Não" : "-"}</td>
          <td>${c.mf === 1 ? "Sim" : c.mf === 0 ? "Não" : "-"}</td>
          <td style="max-width: 150px; word-wrap: break-word;">${condutaStr}</td>
          <td>${c.observacoes || "-"}</td>
        </tr>
      `;
          }
        )
        .join("")}
    </tbody>
  </table>
  `
      : ""
  }

  <!-- Marcos Importantes -->
  ${
    dados.marcos.length > 0
      ? `
  <h2>Marcos Importantes da Gestação</h2>
  <table>
    <thead>
      <tr>
        <th>Marco</th>
        <th>Data</th>
        <th>Período</th>
      </tr>
    </thead>
    <tbody>
      ${dados.marcos
        .map(
          (m) => `
        <tr>
          <td>${m.titulo}</td>
          <td>${m.data}</td>
          <td>${m.periodo}</td>
        </tr>
      `
        )
        .join("")}
    </tbody>
  </table>
  `
      : ""
  }

  <!-- Quebra de página -->
  <div class="page-break"></div>

  <!-- Ultrassons -->
  ${
    dados.ultrassons.length > 0
      ? `
  <h2>Ultrassons Realizados</h2>
  <table>
    <thead>
      <tr>
        <th>Data</th>
        <th>IG</th>
        <th>Tipo</th>
        <th>Observações</th>
      </tr>
    </thead>
    <tbody>
      ${dados.ultrassons
        .map(
          (u) => `
        <tr>
          <td>${u.data}</td>
          <td>${u.ig}</td>
          <td>${u.tipo}</td>
          <td>${u.observacoes || "-"}</td>
        </tr>
      `
        )
        .join("")}
    </tbody>
  </table>
  `
      : ""
  }

  <!-- Exames Laboratoriais -->
  ${
    dados.exames.length > 0
      ? `
  <h2>Exames Laboratoriais</h2>
  <table>
    <thead>
      <tr>
        <th>Exame</th>
        <th>Data</th>
        <th>Trimestre</th>
        <th>Resultado</th>
      </tr>
    </thead>
    <tbody>
      ${dados.exames
        .map(
          (e) => `
        <tr>
          <td>${e.tipo}</td>
          <td>${e.data}</td>
          <td>${e.trimestre}º Trimestre</td>
          <td>${e.resultado}</td>
        </tr>
      `
        )
        .join("")}
    </tbody>
  </table>
  `
      : ""
  }

  <!-- Rodapé -->
  <div class="footer">
    <p>Documento gerado em ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}</p>
    <p>Clínica Mais Mulher - Gestão de Pré-Natal</p>
  </div>
</body>
</html>
  `;

  // Gerar PDF usando Puppeteer com Chromium otimizado
  const browser = await puppeteer.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: true,
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });

  const pdfBuffer = await page.pdf({
    format: "A4",
    printBackground: true,
    margin: {
      top: "10mm",
      right: "10mm",
      bottom: "10mm",
      left: "10mm",
    },
  });

  await browser.close();

  return Buffer.from(pdfBuffer);
}
