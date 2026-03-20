import { useState } from "react";

export default function TermosDeUso() {
  const [language, setLanguage] = useState<"pt" | "en">("pt");

  const containerStyle: React.CSSProperties = {
    maxWidth: "860px",
    margin: "0 auto",
    padding: "40px 24px",
    fontFamily: "'Segoe UI', Arial, sans-serif",
    color: "#1a1a1a",
    lineHeight: "1.7",
  };

  const headerStyle: React.CSSProperties = {
    textAlign: "center",
    marginBottom: "40px",
    paddingBottom: "24px",
    borderBottom: "2px solid #e8c4b8",
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: "1.15rem",
    fontWeight: "700",
    color: "#b5451b",
    marginTop: "32px",
    marginBottom: "10px",
  };

  const paragraphStyle: React.CSSProperties = {
    marginBottom: "14px",
    fontSize: "0.97rem",
  };

  const listStyle: React.CSSProperties = {
    paddingLeft: "20px",
    marginBottom: "14px",
    fontSize: "0.97rem",
  };

  const contactBoxStyle: React.CSSProperties = {
    background: "#fdf6f3",
    border: "1px solid #e8c4b8",
    borderRadius: "8px",
    padding: "20px",
    marginTop: "12px",
  };

  const linkStyle: React.CSSProperties = {
    color: "#b5451b",
    textDecoration: "underline",
  };

  const langBtnBase: React.CSSProperties = {
    padding: "6px 18px",
    borderRadius: "20px",
    border: "1px solid #e8c4b8",
    cursor: "pointer",
    fontSize: "0.9rem",
    fontWeight: "600",
    transition: "all 0.2s",
  };

  return (
    <div style={{ background: "#fffaf8", minHeight: "100vh" }}>
      <div style={containerStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <img
            src="/logo-vertical.png"
            alt="Mais Mulher"
            style={{ height: "80px", marginBottom: "16px" }}
          />
          <h1 style={{ fontSize: "2rem", marginBottom: "10px" }}>
            Termos de Uso | Terms of Use
          </h1>
          <p style={{ color: "#666", fontSize: "0.9rem" }}>
            App Pré-Natal Mais Mulher — Clínica Médica Schlemper LTDA
          </p>
          <p style={{ color: "#888", fontSize: "0.85rem", marginTop: "4px" }}>
            Última atualização: Março de 2026 | Last updated: March 2026
          </p>

          {/* Language toggle */}
          <div style={{ marginTop: "20px", display: "flex", gap: "10px", justifyContent: "center" }}>
            <button
              style={{
                ...langBtnBase,
                background: language === "pt" ? "#b5451b" : "white",
                color: language === "pt" ? "white" : "#b5451b",
              }}
              onClick={() => setLanguage("pt")}
            >
              Português
            </button>
            <button
              style={{
                ...langBtnBase,
                background: language === "en" ? "#b5451b" : "white",
                color: language === "en" ? "white" : "#b5451b",
              }}
              onClick={() => setLanguage("en")}
            >
              English
            </button>
          </div>
        </div>

        {/* Portuguese Version */}
        {language === "pt" && (
          <div>
            <p style={paragraphStyle}>
              Bem-vinda ao aplicativo <strong>Pré-Natal Mais Mulher</strong>. Ao acessar ou utilizar este aplicativo, você concorda com os presentes Termos de Uso. Leia-os atentamente antes de utilizar o serviço.
            </p>

            <h2 style={sectionTitleStyle}>1. Sobre o Aplicativo</h2>
            <p style={paragraphStyle}>
              O <strong>Pré-Natal Mais Mulher</strong> é um aplicativo móvel desenvolvido pela <strong>Clínica Médica Schlemper LTDA</strong> para gestantes acompanhadas pela clínica. O app permite que a paciente visualize informações sobre sua gestação, consultas, exames laboratoriais, ultrassons e orientações médicas fornecidas pelo seu obstetra.
            </p>

            <h2 style={sectionTitleStyle}>2. Elegibilidade</h2>
            <p style={paragraphStyle}>
              O aplicativo destina-se exclusivamente a pacientes gestantes cadastradas e acompanhadas pela Clínica Médica Schlemper LTDA. O acesso é realizado mediante credenciais fornecidas pela clínica. Não é permitido o uso por terceiros não autorizados.
            </p>

            <h2 style={sectionTitleStyle}>3. Uso Permitido</h2>
            <p style={paragraphStyle}>Ao utilizar este aplicativo, você concorda em:</p>
            <ul style={listStyle}>
              <li>Utilizar o app exclusivamente para fins de acompanhamento pré-natal pessoal;</li>
              <li>Não compartilhar suas credenciais de acesso com terceiros;</li>
              <li>Não tentar acessar dados de outras pacientes;</li>
              <li>Não utilizar o aplicativo para fins comerciais, ilegais ou prejudiciais;</li>
              <li>Manter seus dados de contato atualizados junto à clínica.</li>
            </ul>

            <h2 style={sectionTitleStyle}>4. Natureza das Informações</h2>
            <p style={paragraphStyle}>
              As informações disponibilizadas no aplicativo (resultados de exames, dados de ultrassom, orientações médicas) são de caráter <strong>informativo e complementar</strong> ao acompanhamento presencial. Elas <strong>não substituem</strong> a consulta médica, o diagnóstico clínico ou o tratamento prescrito pelo seu obstetra.
            </p>
            <p style={paragraphStyle}>
              Em caso de dúvidas sobre sua saúde ou da saúde do bebê, procure sempre seu médico ou, em situações de urgência, dirija-se à unidade de saúde mais próxima.
            </p>

            <h2 style={sectionTitleStyle}>5. Dados Pessoais e Privacidade</h2>
            <p style={paragraphStyle}>
              O tratamento dos seus dados pessoais e de saúde é regido pela nossa{" "}
              <a href="/privacidade" style={linkStyle}>Política de Privacidade</a>, em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018). Ao utilizar o aplicativo, você consente com o tratamento dos seus dados conforme descrito nessa política.
            </p>

            <h2 style={sectionTitleStyle}>6. Propriedade Intelectual</h2>
            <p style={paragraphStyle}>
              Todo o conteúdo do aplicativo — incluindo textos, imagens, logotipos, design e código-fonte — é de propriedade exclusiva da <strong>Clínica Médica Schlemper LTDA</strong> e está protegido pelas leis de propriedade intelectual brasileiras. É proibida a reprodução, distribuição ou modificação sem autorização prévia e expressa.
            </p>

            <h2 style={sectionTitleStyle}>7. Disponibilidade do Serviço</h2>
            <p style={paragraphStyle}>
              A Clínica Médica Schlemper LTDA envidarão esforços razoáveis para manter o aplicativo disponível. No entanto, não garantimos disponibilidade ininterrupta. O serviço pode ser suspenso temporariamente para manutenção, atualizações ou por razões técnicas, sem aviso prévio.
            </p>

            <h2 style={sectionTitleStyle}>8. Limitação de Responsabilidade</h2>
            <p style={paragraphStyle}>
              A Clínica Médica Schlemper LTDA não se responsabiliza por:
            </p>
            <ul style={listStyle}>
              <li>Decisões médicas tomadas com base exclusiva nas informações do aplicativo;</li>
              <li>Erros de digitação ou inconsistências nos dados inseridos pela equipe médica;</li>
              <li>Falhas de conexão à internet ou no dispositivo da usuária;</li>
              <li>Uso indevido das credenciais de acesso pela usuária ou por terceiros.</li>
            </ul>

            <h2 style={sectionTitleStyle}>9. Modificações dos Termos</h2>
            <p style={paragraphStyle}>
              Estes Termos de Uso podem ser atualizados periodicamente. Alterações significativas serão comunicadas através do aplicativo. O uso continuado do aplicativo após a publicação de alterações constitui aceitação dos novos termos.
            </p>

            <h2 style={sectionTitleStyle}>10. Rescisão de Acesso</h2>
            <p style={paragraphStyle}>
              O acesso ao aplicativo pode ser encerrado a qualquer momento, pela clínica ou pela própria paciente, mediante solicitação. O encerramento ocorre automaticamente ao término do acompanhamento pré-natal.
            </p>

            <h2 style={sectionTitleStyle}>11. Lei Aplicável</h2>
            <p style={paragraphStyle}>
              Estes Termos de Uso são regidos pela legislação brasileira. Fica eleito o foro da Comarca de Joinville — SC para dirimir quaisquer controvérsias decorrentes deste instrumento.
            </p>

            <h2 style={sectionTitleStyle}>12. Contato</h2>
            <div style={contactBoxStyle}>
              <p style={{ marginBottom: "8px" }}><strong>Clínica Médica Schlemper LTDA</strong></p>
              <p style={{ marginBottom: "8px" }}><strong>Responsável:</strong> Dr. André Luis Schlemper</p>
              <p style={{ marginBottom: "8px" }}><strong>Site:</strong>{" "}
                <a href="https://gestantesapp.com" target="_blank" rel="noopener noreferrer" style={linkStyle}>
                  https://gestantesapp.com
                </a>
              </p>
              <p style={{ marginBottom: "8px" }}><strong>E-mail:</strong>{" "}
                <a href="mailto:dreatnu@yahoo.com" style={linkStyle}>dreatnu@yahoo.com</a>
              </p>
              <p style={{ marginBottom: "8px" }}><strong>Telefone:</strong> (47) 3025-1500</p>
              <p style={{ marginBottom: "8px" }}><strong>Endereço:</strong> Rua Dona Francisca, 8300 - Zona Industrial Norte, Joinville - SC, 89219-600, Brasil</p>
            </div>

            <h2 style={sectionTitleStyle}>13. Consentimento</h2>
            <p style={paragraphStyle}>
              Ao utilizar o App Pré-Natal Mais Mulher, você declara ter lido, compreendido e concordado com estes Termos de Uso em sua totalidade.
            </p>
          </div>
        )}

        {/* English Version */}
        {language === "en" && (
          <div>
            <p style={paragraphStyle}>
              Welcome to the <strong>Pré-Natal Mais Mulher</strong> application. By accessing or using this application, you agree to these Terms of Use. Please read them carefully before using the service.
            </p>

            <h2 style={sectionTitleStyle}>1. About the Application</h2>
            <p style={paragraphStyle}>
              <strong>Pré-Natal Mais Mulher</strong> is a mobile application developed by <strong>Clínica Médica Schlemper LTDA</strong> for pregnant patients monitored by the clinic. The app allows patients to view information about their pregnancy, appointments, lab exams, ultrasounds, and medical guidance provided by their obstetrician.
            </p>

            <h2 style={sectionTitleStyle}>2. Eligibility</h2>
            <p style={paragraphStyle}>
              The application is intended exclusively for pregnant patients registered and monitored by Clínica Médica Schlemper LTDA. Access is granted through credentials provided by the clinic. Use by unauthorized third parties is not permitted.
            </p>

            <h2 style={sectionTitleStyle}>3. Permitted Use</h2>
            <p style={paragraphStyle}>By using this application, you agree to:</p>
            <ul style={listStyle}>
              <li>Use the app exclusively for personal prenatal monitoring purposes;</li>
              <li>Not share your access credentials with third parties;</li>
              <li>Not attempt to access other patients' data;</li>
              <li>Not use the application for commercial, illegal, or harmful purposes;</li>
              <li>Keep your contact information updated with the clinic.</li>
            </ul>

            <h2 style={sectionTitleStyle}>4. Nature of Information</h2>
            <p style={paragraphStyle}>
              The information available in the application (exam results, ultrasound data, medical guidance) is <strong>informational and complementary</strong> to in-person monitoring. It <strong>does not replace</strong> medical consultation, clinical diagnosis, or treatment prescribed by your obstetrician.
            </p>
            <p style={paragraphStyle}>
              If you have questions about your health or your baby's health, always consult your doctor or, in emergencies, go to the nearest health facility.
            </p>

            <h2 style={sectionTitleStyle}>5. Personal Data and Privacy</h2>
            <p style={paragraphStyle}>
              The processing of your personal and health data is governed by our{" "}
              <a href="/privacidade" style={linkStyle}>Privacy Policy</a>, in compliance with Brazil's General Data Protection Law (LGPD — Law No. 13,709/2018). By using the application, you consent to the processing of your data as described in that policy.
            </p>

            <h2 style={sectionTitleStyle}>6. Intellectual Property</h2>
            <p style={paragraphStyle}>
              All content in the application — including texts, images, logos, design, and source code — is the exclusive property of <strong>Clínica Médica Schlemper LTDA</strong> and is protected by Brazilian intellectual property laws. Reproduction, distribution, or modification without prior express authorization is prohibited.
            </p>

            <h2 style={sectionTitleStyle}>7. Service Availability</h2>
            <p style={paragraphStyle}>
              Clínica Médica Schlemper LTDA will make reasonable efforts to keep the application available. However, we do not guarantee uninterrupted availability. The service may be temporarily suspended for maintenance, updates, or technical reasons without prior notice.
            </p>

            <h2 style={sectionTitleStyle}>8. Limitation of Liability</h2>
            <p style={paragraphStyle}>
              Clínica Médica Schlemper LTDA is not responsible for:
            </p>
            <ul style={listStyle}>
              <li>Medical decisions made based solely on information from the application;</li>
              <li>Typographical errors or inconsistencies in data entered by the medical team;</li>
              <li>Internet connection failures or issues with the user's device;</li>
              <li>Misuse of access credentials by the user or third parties.</li>
            </ul>

            <h2 style={sectionTitleStyle}>9. Modifications to Terms</h2>
            <p style={paragraphStyle}>
              These Terms of Use may be updated periodically. Significant changes will be communicated through the application. Continued use of the application after changes are published constitutes acceptance of the new terms.
            </p>

            <h2 style={sectionTitleStyle}>10. Termination of Access</h2>
            <p style={paragraphStyle}>
              Access to the application may be terminated at any time, by the clinic or by the patient upon request. Access is automatically terminated at the end of prenatal monitoring.
            </p>

            <h2 style={sectionTitleStyle}>11. Governing Law</h2>
            <p style={paragraphStyle}>
              These Terms of Use are governed by Brazilian law. The courts of Joinville — SC are elected to resolve any disputes arising from this instrument.
            </p>

            <h2 style={sectionTitleStyle}>12. Contact</h2>
            <div style={contactBoxStyle}>
              <p style={{ marginBottom: "8px" }}><strong>Clínica Médica Schlemper LTDA</strong></p>
              <p style={{ marginBottom: "8px" }}><strong>Responsible:</strong> Dr. André Luis Schlemper</p>
              <p style={{ marginBottom: "8px" }}><strong>Website:</strong>{" "}
                <a href="https://gestantesapp.com" target="_blank" rel="noopener noreferrer" style={linkStyle}>
                  https://gestantesapp.com
                </a>
              </p>
              <p style={{ marginBottom: "8px" }}><strong>Email:</strong>{" "}
                <a href="mailto:dreatnu@yahoo.com" style={linkStyle}>dreatnu@yahoo.com</a>
              </p>
              <p style={{ marginBottom: "8px" }}><strong>Phone:</strong> +55 (47) 3025-1500</p>
              <p style={{ marginBottom: "8px" }}><strong>Address:</strong> Rua Dona Francisca, 8300 - Zona Industrial Norte, Joinville - SC, 89219-600, Brazil</p>
            </div>

            <h2 style={sectionTitleStyle}>13. Consent</h2>
            <p style={paragraphStyle}>
              By using the Pré-Natal Mais Mulher App, you declare that you have read, understood, and agreed to these Terms of Use in their entirety.
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ textAlign: "center", padding: "30px 20px", color: "#666", fontSize: "0.9rem", borderTop: "1px solid #e8c4b8" }}>
        <p>
          © {new Date().getFullYear()} Clínica Médica Schlemper LTDA — App Pré-Natal Mais Mulher.{" "}
          <a href="/privacidade" style={linkStyle}>Política de Privacidade</a>
        </p>
      </div>
    </div>
  );
}
