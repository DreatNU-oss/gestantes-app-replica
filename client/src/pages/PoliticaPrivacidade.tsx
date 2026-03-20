import { useState } from 'react';

export default function PoliticaPrivacidade() {
  const [language, setLanguage] = useState<'pt' | 'en'>('pt');

  return (
    <div style={{ 
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif',
      lineHeight: '1.6',
      color: '#333',
      backgroundColor: '#f5f5f5',
      minHeight: '100vh'
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #8B3A62 0%, #6B2A4A 100%)',
        color: 'white',
        padding: '40px 20px',
        textAlign: 'center'
      }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '10px' }}>Política de Privacidade | Privacy Policy</h1>
        <p style={{ fontSize: '1rem', opacity: 0.9 }}>Pré-Natal Mais Mulher</p>
        
        {/* Language Toggle */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '20px' }}>
          <button
            onClick={() => setLanguage('pt')}
            style={{
              padding: '10px 24px',
              border: '2px solid white',
              background: language === 'pt' ? 'white' : 'transparent',
              color: language === 'pt' ? '#8B3A62' : 'white',
              borderRadius: '25px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: 600,
              transition: 'all 0.3s ease'
            }}
          >
            🇧🇷 Português
          </button>
          <button
            onClick={() => setLanguage('en')}
            style={{
              padding: '10px 24px',
              border: '2px solid white',
              background: language === 'en' ? 'white' : 'transparent',
              color: language === 'en' ? '#8B3A62' : 'white',
              borderRadius: '25px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: 600,
              transition: 'all 0.3s ease'
            }}
          >
            🇺🇸 English
          </button>
        </div>
      </div>

      {/* Content Container */}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 20px' }}>
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '40px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          {/* Portuguese Version */}
          {language === 'pt' && (
            <div>
              <p style={{ textAlign: 'center', color: '#666', marginBottom: '30px' }}>
                <strong>Última atualização:</strong> 23 de janeiro de 2026
              </p>

              <h2 style={sectionTitleStyle}>1. Introdução</h2>
              <p style={paragraphStyle}>
                A <strong style={strongStyle}>Clínica Mais Mulher</strong> ("nós", "nosso" ou "Clínica") respeita a privacidade de todas as usuárias do aplicativo móvel <strong style={strongStyle}>Pré-Natal Mais Mulher</strong> ("App", "Aplicativo" ou "Serviço"). Esta Política de Privacidade descreve como coletamos, usamos, armazenamos e protegemos as informações pessoais e de saúde das gestantes que utilizam nosso aplicativo.
              </p>
              <p style={paragraphStyle}>
                Ao utilizar o App Pré-Natal Mais Mulher, você concorda com os termos desta Política de Privacidade. Se você não concordar com qualquer parte desta política, por favor, não utilize o aplicativo.
              </p>
              <div style={highlightBoxStyle}>
                <p style={{ marginBottom: 0 }}>
                  <strong>Esta política está em conformidade com a Lei Geral de Proteção de Dados Pessoais (LGPD - Lei nº 13.709/2018) do Brasil e outras legislações aplicáveis de proteção de dados.</strong>
                </p>
              </div>

              <h2 style={sectionTitleStyle}>2. Informações que Coletamos</h2>
              
              <h3 style={subTitleStyle}>2.1 Informações de Cadastro e Autenticação</h3>
              <p style={paragraphStyle}>Para utilizar o App Pré-Natal Mais Mulher, coletamos as seguintes informações básicas:</p>
              <p style={paragraphStyle}>
                <strong style={strongStyle}>Endereço de e-mail:</strong> Utilizado para autenticação, envio de códigos de verificação e comunicações relacionadas ao serviço. O sistema de autenticação funciona através do envio de um código de verificação de seis dígitos para o e-mail cadastrado, sem necessidade de senha permanente.
              </p>
              <p style={paragraphStyle}>
                <strong style={strongStyle}>Nome completo:</strong> Coletado durante o cadastro inicial na plataforma web da Clínica Mais Mulher (gestantesapp.com) e sincronizado com o aplicativo móvel para personalização da experiência.
              </p>

              <h3 style={subTitleStyle}>2.2 Informações de Saúde e Gestação</h3>
              <p style={paragraphStyle}>O aplicativo coleta e armazena dados sensíveis relacionados à sua saúde gestacional, incluindo:</p>
              <ul style={listStyle}>
                <li style={listItemStyle}><strong style={strongStyle}>História obstétrica:</strong> Informações sobre gestações anteriores, partos normais, cesarianas e abortos.</li>
                <li style={listItemStyle}><strong style={strongStyle}>Dados da gestação atual:</strong> Data da última menstruação (DUM), data provável do parto (DPP), idade gestacional.</li>
                <li style={listItemStyle}><strong style={strongStyle}>Consultas pré-natais:</strong> Registro de consultas, peso materno, pressão arterial, batimentos cardíacos fetais.</li>
                <li style={listItemStyle}><strong style={strongStyle}>Exames laboratoriais:</strong> Histórico de exames de sangue, urina e outros exames.</li>
                <li style={listItemStyle}><strong style={strongStyle}>Ultrassons:</strong> Dados detalhados de exames de ultrassom.</li>
                <li style={listItemStyle}><strong style={strongStyle}>Dados antropométricos:</strong> Peso, altura, IMC, curva de peso gestacional.</li>
                <li style={listItemStyle}><strong style={strongStyle}>Marcos gestacionais:</strong> Acompanhamento de eventos importantes da gestação.</li>
              </ul>

              <h3 style={subTitleStyle}>2.3 Informações de Uso do Aplicativo</h3>
              <p style={paragraphStyle}>Coletamos automaticamente informações sobre como você utiliza o aplicativo:</p>
              <ul style={listStyle}>
                <li style={listItemStyle}><strong style={strongStyle}>Dados de acesso:</strong> Data e hora de acesso, telas visualizadas.</li>
                <li style={listItemStyle}><strong style={strongStyle}>Informações do dispositivo:</strong> Tipo de dispositivo, sistema operacional.</li>
                <li style={listItemStyle}><strong style={strongStyle}>Dados de desempenho:</strong> Informações técnicas sobre o funcionamento do aplicativo.</li>
              </ul>

              <h3 style={subTitleStyle}>2.4 Informações que NÃO Coletamos</h3>
              <p style={paragraphStyle}>O App Pré-Natal Mais Mulher <strong style={strongStyle}>não coleta</strong>:</p>
              <ul style={listStyle}>
                <li style={listItemStyle}>Localização geográfica</li>
                <li style={listItemStyle}>Contatos do dispositivo</li>
                <li style={listItemStyle}>Fotos ou vídeos (exceto quando você anexa arquivos)</li>
                <li style={listItemStyle}>Histórico de navegação</li>
                <li style={listItemStyle}>Informações de pagamento</li>
                <li style={listItemStyle}>Dados de redes sociais</li>
              </ul>

              <h2 style={sectionTitleStyle}>3. Como Usamos suas Informações</h2>
              <p style={paragraphStyle}>As informações coletadas são utilizadas para:</p>
              <ul style={listStyle}>
                <li style={listItemStyle}>Gerenciamento da sua conta e autenticação segura</li>
                <li style={listItemStyle}>Visualização organizada dos seus dados clínicos</li>
                <li style={listItemStyle}>Cálculos automáticos de idade gestacional e indicadores</li>
                <li style={listItemStyle}>Geração de PDF do cartão de pré-natal</li>
                <li style={listItemStyle}>Orientações personalizadas sobre alimentação e cuidados</li>
                <li style={listItemStyle}>Comunicação sobre atualizações e suporte técnico</li>
                <li style={listItemStyle}>Melhoria contínua do serviço</li>
              </ul>

              <h2 style={sectionTitleStyle}>4. Compartilhamento de Informações</h2>
              <p style={paragraphStyle}>
                A Clínica Mais Mulher trata suas informações com o mais alto nível de confidencialidade. <strong style={strongStyle}>Não vendemos, alugamos ou comercializamos suas informações.</strong>
              </p>
              <p style={paragraphStyle}>Seus dados são compartilhados apenas com:</p>
              <ul style={listStyle}>
                <li style={listItemStyle}>Profissionais de saúde da Clínica Mais Mulher que prestam atendimento a você</li>
                <li style={listItemStyle}>Prestadores de serviços técnicos (hospedagem, e-mail) sob contrato de confidencialidade</li>
                <li style={listItemStyle}>Autoridades quando exigido por lei ou ordem judicial</li>
              </ul>

              <h2 style={sectionTitleStyle}>5. Armazenamento e Segurança</h2>
              <p style={paragraphStyle}>Implementamos medidas de segurança técnicas e organizacionais:</p>
              <ul style={listStyle}>
                <li style={listItemStyle}>Criptografia em trânsito (TLS)</li>
                <li style={listItemStyle}>Criptografia em repouso</li>
                <li style={listItemStyle}>Autenticação segura com códigos temporários</li>
                <li style={listItemStyle}>Controle de acesso restrito</li>
                <li style={listItemStyle}>Monitoramento de segurança</li>
                <li style={listItemStyle}>Backups regulares</li>
              </ul>
              <p style={paragraphStyle}>
                Dados de saúde são mantidos por no mínimo 20 anos, conforme legislação brasileira (Resolução CFM nº 1.821/2007).
              </p>

              <h2 style={sectionTitleStyle}>6. Seus Direitos sob a LGPD</h2>
              <p style={paragraphStyle}>Você possui os seguintes direitos:</p>
              <ul style={listStyle}>
                <li style={listItemStyle}><strong style={strongStyle}>Acesso:</strong> Confirmar e acessar seus dados pessoais</li>
                <li style={listItemStyle}><strong style={strongStyle}>Correção:</strong> Solicitar correção de dados incorretos</li>
                <li style={listItemStyle}><strong style={strongStyle}>Exclusão:</strong> Solicitar exclusão de dados</li>
                <li style={listItemStyle}><strong style={strongStyle}>Portabilidade:</strong> Solicitar transferência de dados</li>
                <li style={listItemStyle}><strong style={strongStyle}>Oposição:</strong> Opor-se ao tratamento de dados</li>
                <li style={listItemStyle}><strong style={strongStyle}>Revogar Consentimento:</strong> Retirar consentimento a qualquer momento</li>
              </ul>

              <h2 style={sectionTitleStyle}>7. Encarregado de Proteção de Dados (DPO)</h2>
              <div style={contactBoxStyle}>
                <p style={{ marginBottom: '8px' }}><strong>Nome:</strong> Dr. André Luis Schlemper</p>
                <p style={{ marginBottom: '8px' }}><strong>E-mail:</strong> dpo@gestantesapp.com</p>
                <p style={{ marginBottom: '8px' }}><strong>Telefone:</strong> (47) 3025-1500</p>
              </div>

              <h2 style={sectionTitleStyle}>8. Reclamações à ANPD</h2>
              <p style={paragraphStyle}>
                Se você acredita que seus direitos foram violados, você pode apresentar reclamação à Autoridade Nacional de Proteção de Dados (ANPD): <a href="https://www.gov.br/anpd/" target="_blank" rel="noopener noreferrer" style={linkStyle}>https://www.gov.br/anpd/</a>
              </p>

              <h2 style={sectionTitleStyle}>9. Alterações nesta Política</h2>
              <p style={paragraphStyle}>
                Podemos atualizar esta Política periodicamente. Alterações significativas serão comunicadas através do aplicativo ou por e-mail.
              </p>

              <h2 style={sectionTitleStyle}>10. Contato</h2>
              <div style={contactBoxStyle}>
                <p style={{ marginBottom: '8px' }}><strong>Clínica Médica Schlemper LTDA</strong></p>
                <p style={{ marginBottom: '8px' }}><strong>Responsável:</strong> Dr. André Luis Schlemper</p>
                <p style={{ marginBottom: '8px' }}><strong>Site:</strong> <a href="https://gestantesapp.com" target="_blank" rel="noopener noreferrer" style={linkStyle}>https://gestantesapp.com</a></p>
                <p style={{ marginBottom: '8px' }}><strong>E-mail:</strong> <a href="mailto:dreatnu@yahoo.com" style={linkStyle}>dreatnu@yahoo.com</a></p>
                <p style={{ marginBottom: '8px' }}><strong>Telefone:</strong> (47) 3025-1500</p>
                <p style={{ marginBottom: '8px' }}><strong>Endereço:</strong> Rua Dona Francisca, 8300 - Zona Industrial Norte, Joinville - SC, 89219-600, Brasil</p>
              </div>

              <h2 style={sectionTitleStyle}>11. Consentimento</h2>
              <p style={paragraphStyle}>
                Ao utilizar o App Pré-Natal Mais Mulher, você reconhece que leu, compreendeu e concorda com os termos desta Política de Privacidade.
              </p>
            </div>
          )}

          {/* English Version */}
          {language === 'en' && (
            <div>
              <p style={{ textAlign: 'center', color: '#666', marginBottom: '30px' }}>
                <strong>Last updated:</strong> January 23, 2026
              </p>

              <h2 style={sectionTitleStyle}>1. Introduction</h2>
              <p style={paragraphStyle}>
                <strong style={strongStyle}>Clínica Mais Mulher</strong> ("we", "our" or "Clinic") respects the privacy of all users of the <strong style={strongStyle}>Pré-Natal Mais Mulher</strong> mobile application ("App", "Application" or "Service"). This Privacy Policy describes how we collect, use, store and protect the personal and health information of pregnant women who use our application.
              </p>
              <p style={paragraphStyle}>
                By using the Pré-Natal Mais Mulher App, you agree to the terms of this Privacy Policy. If you do not agree with any part of this policy, please do not use the application.
              </p>
              <div style={highlightBoxStyle}>
                <p style={{ marginBottom: 0 }}>
                  <strong>This policy complies with Brazil's General Data Protection Law (LGPD - Law No. 13.709/2018) and other applicable data protection legislation.</strong>
                </p>
              </div>

              <h2 style={sectionTitleStyle}>2. Information We Collect</h2>
              
              <h3 style={subTitleStyle}>2.1 Registration and Authentication Information</h3>
              <p style={paragraphStyle}>To use the Pré-Natal Mais Mulher App, we collect the following basic information:</p>
              <p style={paragraphStyle}>
                <strong style={strongStyle}>Email address:</strong> Used for authentication, sending verification codes and service-related communications. The authentication system works by sending a six-digit verification code to the registered email, without the need for a permanent password.
              </p>
              <p style={paragraphStyle}>
                <strong style={strongStyle}>Full name:</strong> Collected during initial registration on the Clínica Mais Mulher web platform (gestantesapp.com) and synchronized with the mobile application for experience personalization.
              </p>

              <h3 style={subTitleStyle}>2.2 Health and Pregnancy Information</h3>
              <p style={paragraphStyle}>The application collects and stores sensitive data related to your gestational health, including:</p>
              <ul style={listStyle}>
                <li style={listItemStyle}><strong style={strongStyle}>Obstetric history:</strong> Information about previous pregnancies, normal deliveries, cesarean sections and miscarriages.</li>
                <li style={listItemStyle}><strong style={strongStyle}>Current pregnancy data:</strong> Last menstrual period (LMP), estimated due date (EDD), gestational age.</li>
                <li style={listItemStyle}><strong style={strongStyle}>Prenatal consultations:</strong> Consultation records, maternal weight, blood pressure, fetal heart rate.</li>
                <li style={listItemStyle}><strong style={strongStyle}>Laboratory tests:</strong> History of blood tests, urine tests and other examinations.</li>
                <li style={listItemStyle}><strong style={strongStyle}>Ultrasounds:</strong> Detailed ultrasound examination data.</li>
                <li style={listItemStyle}><strong style={strongStyle}>Anthropometric data:</strong> Weight, height, BMI, gestational weight curve.</li>
                <li style={listItemStyle}><strong style={strongStyle}>Gestational milestones:</strong> Tracking of important pregnancy events.</li>
              </ul>

              <h3 style={subTitleStyle}>2.3 Application Usage Information</h3>
              <p style={paragraphStyle}>We automatically collect information about how you use the application:</p>
              <ul style={listStyle}>
                <li style={listItemStyle}><strong style={strongStyle}>Access data:</strong> Date and time of access, screens viewed.</li>
                <li style={listItemStyle}><strong style={strongStyle}>Device information:</strong> Device type, operating system.</li>
                <li style={listItemStyle}><strong style={strongStyle}>Performance data:</strong> Technical information about application operation.</li>
              </ul>

              <h3 style={subTitleStyle}>2.4 Information We Do NOT Collect</h3>
              <p style={paragraphStyle}>The Pré-Natal Mais Mulher App <strong style={strongStyle}>does not collect</strong>:</p>
              <ul style={listStyle}>
                <li style={listItemStyle}>Geographic location</li>
                <li style={listItemStyle}>Device contacts</li>
                <li style={listItemStyle}>Photos or videos (except when you attach files)</li>
                <li style={listItemStyle}>Browsing history</li>
                <li style={listItemStyle}>Payment information</li>
                <li style={listItemStyle}>Social media data</li>
              </ul>

              <h2 style={sectionTitleStyle}>3. How We Use Your Information</h2>
              <p style={paragraphStyle}>The information collected is used for:</p>
              <ul style={listStyle}>
                <li style={listItemStyle}>Managing your account and secure authentication</li>
                <li style={listItemStyle}>Organized display of your clinical data</li>
                <li style={listItemStyle}>Automatic calculations of gestational age and indicators</li>
                <li style={listItemStyle}>Generation of prenatal card PDF</li>
                <li style={listItemStyle}>Personalized guidance on nutrition and care</li>
                <li style={listItemStyle}>Communication about updates and technical support</li>
                <li style={listItemStyle}>Continuous service improvement</li>
              </ul>

              <h2 style={sectionTitleStyle}>4. Information Sharing</h2>
              <p style={paragraphStyle}>
                Clínica Mais Mulher treats your information with the highest level of confidentiality. <strong style={strongStyle}>We do not sell, rent or commercialize your information.</strong>
              </p>
              <p style={paragraphStyle}>Your data is shared only with:</p>
              <ul style={listStyle}>
                <li style={listItemStyle}>Healthcare professionals at Clínica Mais Mulher who provide care to you</li>
                <li style={listItemStyle}>Technical service providers (hosting, email) under confidentiality agreements</li>
                <li style={listItemStyle}>Authorities when required by law or court order</li>
              </ul>

              <h2 style={sectionTitleStyle}>5. Storage and Security</h2>
              <p style={paragraphStyle}>We implement technical and organizational security measures:</p>
              <ul style={listStyle}>
                <li style={listItemStyle}>Encryption in transit (TLS)</li>
                <li style={listItemStyle}>Encryption at rest</li>
                <li style={listItemStyle}>Secure authentication with temporary codes</li>
                <li style={listItemStyle}>Restricted access control</li>
                <li style={listItemStyle}>Security monitoring</li>
                <li style={listItemStyle}>Regular backups</li>
              </ul>
              <p style={paragraphStyle}>
                Health data is retained for a minimum of 20 years, as required by Brazilian legislation (CFM Resolution No. 1.821/2007).
              </p>

              <h2 style={sectionTitleStyle}>6. Your Rights Under LGPD</h2>
              <p style={paragraphStyle}>You have the following rights:</p>
              <ul style={listStyle}>
                <li style={listItemStyle}><strong style={strongStyle}>Access:</strong> Confirm and access your personal data</li>
                <li style={listItemStyle}><strong style={strongStyle}>Correction:</strong> Request correction of incorrect data</li>
                <li style={listItemStyle}><strong style={strongStyle}>Deletion:</strong> Request deletion of data</li>
                <li style={listItemStyle}><strong style={strongStyle}>Portability:</strong> Request data transfer</li>
                <li style={listItemStyle}><strong style={strongStyle}>Opposition:</strong> Object to data processing</li>
                <li style={listItemStyle}><strong style={strongStyle}>Revoke Consent:</strong> Withdraw consent at any time</li>
              </ul>

              <h2 style={sectionTitleStyle}>7. Data Protection Officer (DPO)</h2>
              <div style={contactBoxStyle}>
                <p style={{ marginBottom: '8px' }}><strong>Name:</strong> Dr. André Luis Schlemper</p>
                <p style={{ marginBottom: '8px' }}><strong>Email:</strong> dpo@gestantesapp.com</p>
                <p style={{ marginBottom: '8px' }}><strong>Phone:</strong> +55 (47) 3025-1500</p>
              </div>

              <h2 style={sectionTitleStyle}>8. Complaints to ANPD</h2>
              <p style={paragraphStyle}>
                If you believe your rights have been violated, you may file a complaint with the National Data Protection Authority (ANPD): <a href="https://www.gov.br/anpd/" target="_blank" rel="noopener noreferrer" style={linkStyle}>https://www.gov.br/anpd/</a>
              </p>

              <h2 style={sectionTitleStyle}>9. Changes to This Policy</h2>
              <p style={paragraphStyle}>
                We may update this Policy periodically. Significant changes will be communicated through the application or by email.
              </p>

              <h2 style={sectionTitleStyle}>10. Contact</h2>
              <div style={contactBoxStyle}>
                <p style={{ marginBottom: '8px' }}><strong>Clínica Médica Schlemper LTDA</strong></p>
                <p style={{ marginBottom: '8px' }}><strong>Responsible:</strong> Dr. André Luis Schlemper</p>
                <p style={{ marginBottom: '8px' }}><strong>Website:</strong> <a href="https://gestantesapp.com" target="_blank" rel="noopener noreferrer" style={linkStyle}>https://gestantesapp.com</a></p>
                <p style={{ marginBottom: '8px' }}><strong>Email:</strong> <a href="mailto:dreatnu@yahoo.com" style={linkStyle}>dreatnu@yahoo.com</a></p>
                <p style={{ marginBottom: '8px' }}><strong>Phone:</strong> +55 (47) 3025-1500</p>
                <p style={{ marginBottom: '8px' }}><strong>Address:</strong> Rua Dona Francisca, 8300 - Zona Industrial Norte, Joinville - SC, 89219-600, Brazil</p>
              </div>

              <h2 style={sectionTitleStyle}>11. Consent</h2>
              <p style={paragraphStyle}>
                By using the Pré-Natal Mais Mulher App, you acknowledge that you have read, understood and agree to the terms of this Privacy Policy.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', padding: '30px 20px', color: '#666', fontSize: '0.9rem' }}>
        <p>© 2024-2026 Clínica Mais Mulher. All rights reserved. | Todos os direitos reservados.</p>
      </div>
    </div>
  );
}

// Styles
const sectionTitleStyle: React.CSSProperties = {
  color: '#8B3A62',
  fontSize: '1.5rem',
  marginTop: '30px',
  marginBottom: '15px',
  paddingBottom: '10px',
  borderBottom: '2px solid #f0e6eb'
};

const subTitleStyle: React.CSSProperties = {
  color: '#6B2A4A',
  fontSize: '1.2rem',
  marginTop: '20px',
  marginBottom: '10px'
};

const paragraphStyle: React.CSSProperties = {
  marginBottom: '15px',
  textAlign: 'justify'
};

const strongStyle: React.CSSProperties = {
  color: '#6B2A4A'
};

const highlightBoxStyle: React.CSSProperties = {
  background: '#f9f4f6',
  borderLeft: '4px solid #8B3A62',
  padding: '15px 20px',
  margin: '20px 0',
  borderRadius: '0 8px 8px 0'
};

const listStyle: React.CSSProperties = {
  margin: '15px 0',
  paddingLeft: '25px'
};

const listItemStyle: React.CSSProperties = {
  marginBottom: '8px'
};

const contactBoxStyle: React.CSSProperties = {
  background: '#f9f4f6',
  padding: '20px',
  borderRadius: '8px',
  margin: '20px 0'
};

const linkStyle: React.CSSProperties = {
  color: '#8B3A62',
  textDecoration: 'none'
};
