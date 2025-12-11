import { forwardRef } from "react";

interface CartaoPrenatalPDFProps {
  gestante: any;
  consultas: any[];
  marcos: any[];
  ultrassons: any[];
  exames: any[];
}

export const CartaoPrenatalPDF = forwardRef<HTMLDivElement, CartaoPrenatalPDFProps>(
  ({ gestante, consultas, marcos, ultrassons, exames }, ref) => {
    const formatDate = (date: string | Date | null) => {
      if (!date) return "-";
      const d = typeof date === "string" ? new Date(date) : date;
      return d.toLocaleDateString("pt-BR");
    };

    return (
      <div
        ref={ref}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "210mm",
          padding: "20mm",
          backgroundColor: "white",
          fontFamily: "Arial, sans-serif",
          fontSize: "12px",
          lineHeight: "1.5",
          visibility: "hidden",
          pointerEvents: "none",
        }}
      >
        {/* Cabeçalho com Logo */}
        <div style={{ textAlign: "center", marginBottom: "20px", borderBottom: "2px solid #8B4B5B" }}>
          <img
            src="/logo-horizontal.png"
            alt="Clínica Mais Mulher"
            style={{ height: "60px", marginBottom: "10px" }}
          />
          <h1 style={{ color: "#8B4B5B", fontSize: "24px", margin: "10px 0" }}>
            Cartão de Pré-natal
          </h1>
        </div>

        {/* Dados da Gestante */}
        <div style={{ marginBottom: "20px" }}>
          <h2 style={{ color: "#8B4B5B", fontSize: "18px", borderBottom: "1px solid #ddd", paddingBottom: "5px" }}>
            Dados da Gestante
          </h2>
          <table style={{ width: "100%", marginTop: "10px", borderCollapse: "collapse" }}>
            <tbody>
              <tr>
                <td style={{ padding: "5px", fontWeight: "bold", width: "30%" }}>Nome Completo:</td>
                <td style={{ padding: "5px" }}>{gestante.nome}</td>
              </tr>
              <tr>
                <td style={{ padding: "5px", fontWeight: "bold" }}>Data de Nascimento:</td>
                <td style={{ padding: "5px" }}>{formatDate(gestante.dataNascimento)}</td>
              </tr>
              <tr>
                <td style={{ padding: "5px", fontWeight: "bold" }}>DUM:</td>
                <td style={{ padding: "5px" }}>{formatDate(gestante.dum)}</td>
              </tr>
              <tr>
                <td style={{ padding: "5px", fontWeight: "bold" }}>DPP pela DUM:</td>
                <td style={{ padding: "5px" }}>{formatDate(gestante.calculado?.dpp)}</td>
              </tr>
              <tr>
                <td style={{ padding: "5px", fontWeight: "bold" }}>DPP pelo Ultrassom:</td>
                <td style={{ padding: "5px" }}>{formatDate(gestante.calculado?.dppUS)}</td>
              </tr>
              <tr>
                <td style={{ padding: "5px", fontWeight: "bold" }}>Histórico Obstétrico:</td>
                <td style={{ padding: "5px" }}>
                  G{gestante.gesta || 0} P{gestante.para || 0} A{gestante.abortos || 0}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Marcos Importantes */}
        {marcos && marcos.length > 0 && (
          <div style={{ marginBottom: "20px", pageBreakInside: "avoid" }}>
            <h2 style={{ color: "#8B4B5B", fontSize: "18px", borderBottom: "1px solid #ddd", paddingBottom: "5px" }}>
              Marcos Importantes da Gestação
            </h2>
            <table style={{ width: "100%", marginTop: "10px", borderCollapse: "collapse", border: "1px solid #ddd" }}>
              <thead>
                <tr style={{ backgroundColor: "#f5f5f5" }}>
                  <th style={{ padding: "8px", textAlign: "left", border: "1px solid #ddd" }}>Marco</th>
                  <th style={{ padding: "8px", textAlign: "left", border: "1px solid #ddd" }}>Data</th>
                </tr>
              </thead>
              <tbody>
                {marcos.map((marco, idx) => (
                  <tr key={idx}>
                    <td style={{ padding: "8px", border: "1px solid #ddd" }}>{marco.titulo}</td>
                    <td style={{ padding: "8px", border: "1px solid #ddd" }}>{marco.data}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Histórico de Consultas */}
        {consultas && consultas.length > 0 && (
          <div style={{ marginBottom: "20px", pageBreakInside: "avoid" }}>
            <h2 style={{ color: "#8B4B5B", fontSize: "18px", borderBottom: "1px solid #ddd", paddingBottom: "5px" }}>
              Histórico de Consultas Pré-natais
            </h2>
            <table style={{ width: "100%", marginTop: "10px", borderCollapse: "collapse", border: "1px solid #ddd", fontSize: "10px" }}>
              <thead>
                <tr style={{ backgroundColor: "#f5f5f5" }}>
                  <th style={{ padding: "6px", border: "1px solid #ddd" }}>Data</th>
                  <th style={{ padding: "6px", border: "1px solid #ddd" }}>IG</th>
                  <th style={{ padding: "6px", border: "1px solid #ddd" }}>Peso</th>
                  <th style={{ padding: "6px", border: "1px solid #ddd" }}>PA</th>
                  <th style={{ padding: "6px", border: "1px solid #ddd" }}>AU</th>
                  <th style={{ padding: "6px", border: "1px solid #ddd" }}>BCF</th>
                  <th style={{ padding: "6px", border: "1px solid #ddd" }}>MF</th>
                  <th style={{ padding: "6px", border: "1px solid #ddd" }}>Observações</th>
                </tr>
              </thead>
              <tbody>
                {consultas.map((consulta, idx) => (
                  <tr key={idx}>
                    <td style={{ padding: "6px", border: "1px solid #ddd" }}>{formatDate(consulta.dataConsulta)}</td>
                    <td style={{ padding: "6px", border: "1px solid #ddd" }}>{consulta.ig || "-"}</td>
                    <td style={{ padding: "6px", border: "1px solid #ddd" }}>{consulta.peso ? `${(consulta.peso / 1000).toFixed(1)} kg` : "-"}</td>
                    <td style={{ padding: "6px", border: "1px solid #ddd" }}>{consulta.pa || "-"}</td>
                    <td style={{ padding: "6px", border: "1px solid #ddd" }}>{consulta.au ? `${consulta.au} cm` : "-"}</td>
                    <td style={{ padding: "6px", border: "1px solid #ddd" }}>{consulta.bcf === 1 ? "Sim" : consulta.bcf === 0 ? "Não" : "-"}</td>
                    <td style={{ padding: "6px", border: "1px solid #ddd" }}>{consulta.mf === 1 ? "Sim" : consulta.mf === 0 ? "Não" : "-"}</td>
                    <td style={{ padding: "6px", border: "1px solid #ddd" }}>{consulta.observacoes || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Ultrassons */}
        {ultrassons && ultrassons.length > 0 && (
          <div style={{ marginBottom: "20px", pageBreakInside: "avoid" }}>
            <h2 style={{ color: "#8B4B5B", fontSize: "18px", borderBottom: "1px solid #ddd", paddingBottom: "5px" }}>
              Ultrassons Realizados
            </h2>
            <table style={{ width: "100%", marginTop: "10px", borderCollapse: "collapse", border: "1px solid #ddd" }}>
              <thead>
                <tr style={{ backgroundColor: "#f5f5f5" }}>
                  <th style={{ padding: "8px", textAlign: "left", border: "1px solid #ddd" }}>Data</th>
                  <th style={{ padding: "8px", textAlign: "left", border: "1px solid #ddd" }}>IG</th>
                  <th style={{ padding: "8px", textAlign: "left", border: "1px solid #ddd" }}>Tipo</th>
                  <th style={{ padding: "8px", textAlign: "left", border: "1px solid #ddd" }}>Observações</th>
                </tr>
              </thead>
              <tbody>
                {ultrassons.map((us, idx) => (
                  <tr key={idx}>
                    <td style={{ padding: "8px", border: "1px solid #ddd" }}>{formatDate(us.data)}</td>
                    <td style={{ padding: "8px", border: "1px solid #ddd" }}>{us.ig || "-"}</td>
                    <td style={{ padding: "8px", border: "1px solid #ddd" }}>{us.tipo || "-"}</td>
                    <td style={{ padding: "8px", border: "1px solid #ddd" }}>{us.observacoes || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Exames Laboratoriais */}
        {exames && exames.length > 0 && (
          <div style={{ marginBottom: "20px" }}>
            <h2 style={{ color: "#8B4B5B", fontSize: "18px", borderBottom: "1px solid #ddd", paddingBottom: "5px" }}>
              Exames Laboratoriais
            </h2>
            <div style={{ marginTop: "10px", fontSize: "10px" }}>
              {exames.map((exame, idx) => (
                <div key={idx} style={{ marginBottom: "15px", pageBreakInside: "avoid" }}>
                  <div style={{ fontWeight: "bold", marginBottom: "5px" }}>
                    {exame.nome} - {formatDate(exame.data)}
                  </div>
                  <div style={{ marginLeft: "10px" }}>
                    {exame.resultado && typeof exame.resultado === "object" ? (
                      Object.entries(exame.resultado).map(([key, value]) => (
                        <div key={key} style={{ padding: "2px 0" }}>
                          <span style={{ fontWeight: "bold" }}>{key}:</span> {String(value)}
                        </div>
                      ))
                    ) : (
                      <div>{exame.resultado || "-"}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rodapé */}
        <div style={{ marginTop: "30px", paddingTop: "10px", borderTop: "1px solid #ddd", textAlign: "center", fontSize: "10px", color: "#666" }}>
          <p>Clínica Mais Mulher - Gestão de Pré-Natal</p>
          <p>Documento gerado em {new Date().toLocaleDateString("pt-BR")} às {new Date().toLocaleTimeString("pt-BR")}</p>
        </div>
      </div>
    );
  }
);

CartaoPrenatalPDF.displayName = "CartaoPrenatalPDF";
