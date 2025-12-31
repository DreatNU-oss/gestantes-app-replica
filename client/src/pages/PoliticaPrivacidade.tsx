export default function PoliticaPrivacidade() {
  return (
    <div style={{ 
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      lineHeight: '1.6',
      color: '#333',
      backgroundColor: '#f5f5f5',
      minHeight: '100vh',
      padding: '0'
    }}>
      <div style={{
        maxWidth: '900px',
        margin: '0 auto',
        padding: '20px',
        backgroundColor: '#fff',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <header style={{
          backgroundColor: '#722F37',
          color: 'white',
          padding: '30px 20px',
          textAlign: 'center',
          margin: '-20px -20px 30px -20px'
        }}>
          <h1 style={{ fontSize: '28px', marginBottom: '10px' }}>Política de Privacidade</h1>
          <p style={{ fontSize: '14px', opacity: 0.9 }}>Mais Mulher - Acompanhamento Pré-Natal</p>
          <p style={{ fontSize: '14px', opacity: 0.9 }}><strong>Última atualização:</strong> 31 de dezembro de 2024</p>
        </header>

        <section>
          <h2 style={{ color: '#722F37', fontSize: '24px', marginTop: '40px', marginBottom: '15px', paddingBottom: '10px', borderBottom: '2px solid #C4A4A4' }}>1. Introdução</h2>
          <p style={{ marginBottom: '15px', textAlign: 'justify' }}>A <strong style={{ color: '#722F37' }}>Clínica Mais Mulher</strong> ("nós", "nosso" ou "Clínica") respeita a privacidade de todas as usuárias do aplicativo móvel <strong style={{ color: '#722F37' }}>Mais Mulher - Acompanhamento Pré-Natal</strong> ("App", "Aplicativo" ou "Serviço"). Esta Política de Privacidade descreve como coletamos, usamos, armazenamos e protegemos as informações pessoais e de saúde das gestantes que utilizam nosso aplicativo.</p>
          
          <p style={{ marginBottom: '15px', textAlign: 'justify' }}>Ao utilizar o App Mais Mulher, você concorda com os termos desta Política de Privacidade. Se você não concordar com qualquer parte desta política, por favor, não utilize o aplicativo.</p>
          
          <div style={{ backgroundColor: '#F5E6C8', padding: '15px', borderLeft: '4px solid #722F37', margin: '20px 0' }}>
            <p style={{ marginBottom: '0' }}><strong style={{ color: '#722F37' }}>Esta política está em conformidade com a Lei Geral de Proteção de Dados Pessoais (LGPD - Lei nº 13.709/2018) do Brasil e outras legislações aplicáveis de proteção de dados.</strong></p>
          </div>
        </section>

        <section>
          <h2 style={{ color: '#722F37', fontSize: '24px', marginTop: '40px', marginBottom: '15px', paddingBottom: '10px', borderBottom: '2px solid #C4A4A4' }}>2. Informações que Coletamos</h2>
          
          <h3 style={{ color: '#722F37', fontSize: '18px', marginTop: '25px', marginBottom: '12px' }}>2.1 Informações de Cadastro e Autenticação</h3>
          <p style={{ marginBottom: '15px', textAlign: 'justify' }}>Para utilizar o App Mais Mulher, coletamos as seguintes informações básicas:</p>
          <p style={{ marginBottom: '15px', textAlign: 'justify' }}><strong style={{ color: '#722F37' }}>Endereço de e-mail:</strong> Utilizado para autenticação, envio de códigos de verificação e comunicações relacionadas ao serviço. O sistema de autenticação funciona através do envio de um código de verificação de seis dígitos para o e-mail cadastrado, sem necessidade de senha permanente.</p>
          <p style={{ marginBottom: '15px', textAlign: 'justify' }}><strong style={{ color: '#722F37' }}>Nome completo:</strong> Coletado durante o cadastro inicial na plataforma web da Clínica Mais Mulher (gestantesapp.com) e sincronizado com o aplicativo móvel para personalização da experiência.</p>
          
          <h3 style={{ color: '#722F37', fontSize: '18px', marginTop: '25px', marginBottom: '12px' }}>2.2 Informações de Saúde e Gestação</h3>
          <p style={{ marginBottom: '15px', textAlign: 'justify' }}>O aplicativo coleta e armazena dados sensíveis relacionados à sua saúde gestacional, incluindo:</p>
          <p style={{ marginBottom: '15px', textAlign: 'justify' }}><strong style={{ color: '#722F37' }}>História obstétrica:</strong> Informações sobre gestações anteriores, partos normais, cesarianas e abortos, apresentadas no formato padronizado (exemplo: G1P0(0PN0PC)A0).</p>
          <p style={{ marginBottom: '15px', textAlign: 'justify' }}><strong style={{ color: '#722F37' }}>Dados da gestação atual:</strong> Data da última menstruação (DUM), data provável do parto (DPP), idade gestacional em semanas e dias, tipo de parto desejado.</p>
          <p style={{ marginBottom: '15px', textAlign: 'justify' }}><strong style={{ color: '#722F37' }}>Consultas pré-natais:</strong> Registro completo de todas as consultas realizadas, incluindo data, idade gestacional no momento da consulta, peso materno, pressão arterial (PA), batimentos cardíacos fetais (BCF) e observações clínicas.</p>
          <p style={{ marginBottom: '15px', textAlign: 'justify' }}><strong style={{ color: '#722F37' }}>Exames laboratoriais:</strong> Histórico de exames de sangue, urina e outros exames solicitados durante o pré-natal, incluindo tipo de exame, data de realização, resultados e arquivos anexados.</p>
          <p style={{ marginBottom: '15px', textAlign: 'justify' }}><strong style={{ color: '#722F37' }}>Ultrassons:</strong> Dados detalhados de exames de ultrassom, incluindo tipo de exame (morfológico, obstétrico, doppler), idade gestacional, medidas fetais, apresentação fetal, situação, dorso, placenta, líquido amniótico, translucência nucal, osso nasal, anatomia fetal detalhada, peso fetal estimado, dopplerfluxometria, sexo fetal, observações médicas e arquivos de imagem anexados.</p>
          <p style={{ marginBottom: '15px', textAlign: 'justify' }}><strong style={{ color: '#722F37' }}>Dados antropométricos:</strong> Peso pré-gestacional, altura, índice de massa corporal (IMC), peso atual, ganho de peso gestacional, curva de peso ao longo da gestação e faixa de ganho de peso ideal.</p>
          <p style={{ marginBottom: '15px', textAlign: 'justify' }}><strong style={{ color: '#722F37' }}>Marcos gestacionais:</strong> Acompanhamento de eventos importantes da gestação, como data estimada de concepção, períodos recomendados para ultrassons morfológicos, marcos de desenvolvimento fetal, períodos de vacinação (dTpa, bronquiolite) e outras orientações médicas programadas.</p>
          
          <h3 style={{ color: '#722F37', fontSize: '18px', marginTop: '25px', marginBottom: '12px' }}>2.3 Informações de Uso do Aplicativo</h3>
          <p style={{ marginBottom: '15px', textAlign: 'justify' }}>Coletamos automaticamente informações sobre como você utiliza o aplicativo:</p>
          <p style={{ marginBottom: '15px', textAlign: 'justify' }}><strong style={{ color: '#722F37' }}>Dados de acesso:</strong> Data e hora de acesso, telas visualizadas, funcionalidades utilizadas e tempo de permanência no aplicativo.</p>
          <p style={{ marginBottom: '15px', textAlign: 'justify' }}><strong style={{ color: '#722F37' }}>Informações do dispositivo:</strong> Tipo de dispositivo (iPhone, iPad, dispositivo Android), sistema operacional e versão, identificador único do dispositivo, configurações de idioma e fuso horário.</p>
          <p style={{ marginBottom: '15px', textAlign: 'justify' }}><strong style={{ color: '#722F37' }}>Dados de desempenho:</strong> Informações técnicas sobre o funcionamento do aplicativo, incluindo erros, falhas, tempo de carregamento de telas e uso de recursos do dispositivo.</p>
          
          <h3 style={{ color: '#722F37', fontSize: '18px', marginTop: '25px', marginBottom: '12px' }}>2.4 Informações que NÃO Coletamos</h3>
          <p style={{ marginBottom: '15px', textAlign: 'justify' }}>O App Mais Mulher <strong style={{ color: '#722F37' }}>não coleta</strong> as seguintes informações:</p>
          <ul style={{ marginLeft: '25px', marginBottom: '15px' }}>
            <li style={{ marginBottom: '8px' }}>Localização geográfica precisa ou aproximada</li>
            <li style={{ marginBottom: '8px' }}>Contatos armazenados no dispositivo</li>
            <li style={{ marginBottom: '8px' }}>Fotos ou vídeos da galeria do dispositivo (exceto quando você escolhe anexar arquivos específicos)</li>
            <li style={{ marginBottom: '8px' }}>Histórico de navegação em outros aplicativos ou sites</li>
            <li style={{ marginBottom: '8px' }}>Informações de pagamento (o aplicativo é gratuito)</li>
            <li style={{ marginBottom: '8px' }}>Dados de redes sociais</li>
          </ul>
        </section>

        <section>
          <h2 style={{ color: '#722F37', fontSize: '24px', marginTop: '40px', marginBottom: '15px', paddingBottom: '10px', borderBottom: '2px solid #C4A4A4' }}>3. Como Usamos suas Informações</h2>
          <p style={{ marginBottom: '15px', textAlign: 'justify' }}>As informações coletadas são utilizadas exclusivamente para as seguintes finalidades:</p>
          
          <h3 style={{ color: '#722F37', fontSize: '18px', marginTop: '25px', marginBottom: '12px' }}>3.1 Prestação do Serviço de Acompanhamento Pré-Natal</h3>
          <p style={{ marginBottom: '15px', textAlign: 'justify' }}><strong style={{ color: '#722F37' }}>Gerenciamento da conta:</strong> Criação, autenticação e manutenção da sua conta de usuária no aplicativo, permitindo acesso seguro aos seus dados de saúde gestacional.</p>
          <p style={{ marginBottom: '15px', textAlign: 'justify' }}><strong style={{ color: '#722F37' }}>Visualização de dados clínicos:</strong> Apresentação organizada e compreensível de todas as informações relacionadas ao seu pré-natal, incluindo consultas, exames, ultrassons, marcos gestacionais e curva de peso.</p>
          <p style={{ marginBottom: '15px', textAlign: 'justify' }}><strong style={{ color: '#722F37' }}>Cálculos automáticos:</strong> Processamento de dados para calcular automaticamente a idade gestacional, data provável do parto, ganho de peso gestacional, faixa de peso ideal e outros indicadores relevantes.</p>
          <p style={{ marginBottom: '15px', textAlign: 'justify' }}><strong style={{ color: '#722F37' }}>Geração de documentos:</strong> Criação de PDF do cartão de pré-natal contendo todas as informações registradas, permitindo que você compartilhe seus dados com outros profissionais de saúde ou mantenha uma cópia física.</p>
          <p style={{ marginBottom: '15px', textAlign: 'justify' }}><strong style={{ color: '#722F37' }}>Orientações personalizadas:</strong> Fornecimento de orientações alimentares, informações sobre internação para cesariana, cuidados pós-parto normal e pós-cesariana, adaptadas ao seu momento gestacional.</p>
          
          <h3 style={{ color: '#722F37', fontSize: '18px', marginTop: '25px', marginBottom: '12px' }}>3.2 Comunicação com a Usuária</h3>
          <p style={{ marginBottom: '15px', textAlign: 'justify' }}><strong style={{ color: '#722F37' }}>Autenticação:</strong> Envio de códigos de verificação por e-mail para garantir acesso seguro ao aplicativo.</p>
          <p style={{ marginBottom: '15px', textAlign: 'justify' }}><strong style={{ color: '#722F37' }}>Notificações importantes:</strong> Comunicação sobre atualizações do aplicativo, mudanças na política de privacidade ou termos de uso, e informações relevantes sobre o serviço.</p>
          <p style={{ marginBottom: '15px', textAlign: 'justify' }}><strong style={{ color: '#722F37' }}>Suporte técnico:</strong> Resposta a solicitações de ajuda, dúvidas sobre o funcionamento do aplicativo ou problemas técnicos reportados.</p>
          
          <h3 style={{ color: '#722F37', fontSize: '18px', marginTop: '25px', marginBottom: '12px' }}>3.3 Melhoria do Serviço</h3>
          <p style={{ marginBottom: '15px', textAlign: 'justify' }}><strong style={{ color: '#722F37' }}>Análise de uso:</strong> Compreensão de como as usuárias interagem com o aplicativo para identificar funcionalidades mais utilizadas, pontos de dificuldade e oportunidades de melhoria.</p>
          <p style={{ marginBottom: '15px', textAlign: 'justify' }}><strong style={{ color: '#722F37' }}>Correção de erros:</strong> Identificação e resolução de problemas técnicos, bugs e falhas no funcionamento do aplicativo.</p>
          <p style={{ marginBottom: '15px', textAlign: 'justify' }}><strong style={{ color: '#722F37' }}>Desenvolvimento de novas funcionalidades:</strong> Planejamento e implementação de recursos adicionais baseados nas necessidades identificadas das usuárias.</p>
          
          <h3 style={{ color: '#722F37', fontSize: '18px', marginTop: '25px', marginBottom: '12px' }}>3.4 Conformidade Legal</h3>
          <p style={{ marginBottom: '15px', textAlign: 'justify' }}><strong style={{ color: '#722F37' }}>Cumprimento de obrigações legais:</strong> Atendimento a requisitos legais, regulatórios ou determinações judiciais que exijam o fornecimento de informações.</p>
          <p style={{ marginBottom: '15px', textAlign: 'justify' }}><strong style={{ color: '#722F37' }}>Proteção de direitos:</strong> Defesa dos direitos da Clínica Mais Mulher, prevenção de fraudes e proteção da segurança das usuárias e do serviço.</p>
        </section>

        <section>
          <h2 style={{ color: '#722F37', fontSize: '24px', marginTop: '40px', marginBottom: '15px', paddingBottom: '10px', borderBottom: '2px solid #C4A4A4' }}>4. Compartilhamento de Informações</h2>
          <div style={{ backgroundColor: '#F5E6C8', padding: '15px', borderLeft: '4px solid #722F37', margin: '20px 0' }}>
            <p style={{ marginBottom: '0' }}><strong style={{ color: '#722F37' }}>A Clínica Mais Mulher trata suas informações de saúde com o mais alto nível de confidencialidade e segurança. Não vendemos, alugamos ou comercializamos suas informações pessoais ou de saúde para terceiros.</strong></p>
          </div>
          
          <h3 style={{ color: '#722F37', fontSize: '18px', marginTop: '25px', marginBottom: '12px' }}>4.1 Compartilhamento com Profissionais de Saúde</h3>
          <p style={{ marginBottom: '15px', textAlign: 'justify' }}>Os dados inseridos no aplicativo são compartilhados exclusivamente com os <strong style={{ color: '#722F37' }}>profissionais de saúde da Clínica Mais Mulher</strong> que prestam atendimento direto a você durante o pré-natal. Isso inclui médicos obstetras, enfermeiras obstétricas e outros membros da equipe clínica responsáveis pelo seu acompanhamento.</p>
          
          <h3 style={{ color: '#722F37', fontSize: '18px', marginTop: '25px', marginBottom: '12px' }}>4.2 Compartilhamento com Prestadores de Serviços Técnicos</h3>
          <p style={{ marginBottom: '15px', textAlign: 'justify' }}>Para operar o aplicativo, contamos com prestadores de serviços técnicos que processam dados em nosso nome, incluindo serviços de hospedagem, envio de e-mails e análise técnica. Todos os prestadores são cuidadosamente selecionados e estão contratualmente obrigados a proteger suas informações.</p>
          
          <h3 style={{ color: '#722F37', fontSize: '18px', marginTop: '25px', marginBottom: '12px' }}>4.3 Compartilhamento por Determinação Legal</h3>
          <p style={{ marginBottom: '15px', textAlign: 'justify' }}>Podemos divulgar suas informações quando exigido por lei, ordem judicial, intimação ou outro processo legal, ou quando necessário para proteger direitos, propriedade ou segurança.</p>
        </section>

        <section>
          <h2 style={{ color: '#722F37', fontSize: '24px', marginTop: '40px', marginBottom: '15px', paddingBottom: '10px', borderBottom: '2px solid #C4A4A4' }}>5. Armazenamento e Segurança dos Dados</h2>
          
          <h3 style={{ color: '#722F37', fontSize: '18px', marginTop: '25px', marginBottom: '12px' }}>5.1 Medidas de Segurança Técnicas</h3>
          <p style={{ marginBottom: '15px', textAlign: 'justify' }}>Implementamos medidas de segurança técnicas e organizacionais apropriadas para proteger suas informações, incluindo:</p>
          <ul style={{ marginLeft: '25px', marginBottom: '15px' }}>
            <li style={{ marginBottom: '8px' }}><strong style={{ color: '#722F37' }}>Criptografia em trânsito:</strong> Todas as comunicações são protegidas por TLS</li>
            <li style={{ marginBottom: '8px' }}><strong style={{ color: '#722F37' }}>Criptografia em repouso:</strong> Dados sensíveis são criptografados nos servidores</li>
            <li style={{ marginBottom: '8px' }}><strong style={{ color: '#722F37' }}>Autenticação segura:</strong> Sistema baseado em códigos temporários</li>
            <li style={{ marginBottom: '8px' }}><strong style={{ color: '#722F37' }}>Controle de acesso:</strong> Acesso restrito a funcionários autorizados</li>
            <li style={{ marginBottom: '8px' }}><strong style={{ color: '#722F37' }}>Monitoramento de segurança:</strong> Detecção de intrusão e resposta a incidentes</li>
            <li style={{ marginBottom: '8px' }}><strong style={{ color: '#722F37' }}>Backups regulares:</strong> Cópias de segurança automáticas</li>
          </ul>
          
          <h3 style={{ color: '#722F37', fontSize: '18px', marginTop: '25px', marginBottom: '12px' }}>5.2 Período de Retenção dos Dados</h3>
          <p style={{ marginBottom: '15px', textAlign: 'justify' }}>Mantemos suas informações pelo tempo necessário para cumprir as finalidades descritas nesta política. Dados de saúde são mantidos por no mínimo <strong style={{ color: '#722F37' }}>20 anos</strong>, conforme exigido pela legislação brasileira para prontuários médicos (Resolução CFM nº 1.821/2007).</p>
        </section>

        <section>
          <h2 style={{ color: '#722F37', fontSize: '24px', marginTop: '40px', marginBottom: '15px', paddingBottom: '10px', borderBottom: '2px solid #C4A4A4' }}>6. Seus Direitos sob a LGPD</h2>
          <p style={{ marginBottom: '15px', textAlign: 'justify' }}>De acordo com a Lei Geral de Proteção de Dados Pessoais (LGPD), você possui os seguintes direitos:</p>
          <ul style={{ marginLeft: '25px', marginBottom: '15px' }}>
            <li style={{ marginBottom: '8px' }}><strong style={{ color: '#722F37' }}>Direito de Acesso:</strong> Confirmar e acessar seus dados pessoais</li>
            <li style={{ marginBottom: '8px' }}><strong style={{ color: '#722F37' }}>Direito de Correção:</strong> Solicitar correção de dados incompletos ou inexatos</li>
            <li style={{ marginBottom: '8px' }}><strong style={{ color: '#722F37' }}>Direito de Exclusão:</strong> Solicitar exclusão de dados (exceto quando houver obrigação legal de retenção)</li>
            <li style={{ marginBottom: '8px' }}><strong style={{ color: '#722F37' }}>Direito à Portabilidade:</strong> Solicitar transferência de dados para outro prestador</li>
            <li style={{ marginBottom: '8px' }}><strong style={{ color: '#722F37' }}>Direito de Oposição:</strong> Opor-se ao tratamento de dados em certas circunstâncias</li>
            <li style={{ marginBottom: '8px' }}><strong style={{ color: '#722F37' }}>Direito de Revogar Consentimento:</strong> Retirar consentimento a qualquer momento</li>
          </ul>
          
          <div style={{ backgroundColor: '#f9f9f9', border: '1px solid #ddd', padding: '20px', margin: '20px 0', borderRadius: '5px' }}>
            <h3 style={{ color: '#722F37', fontSize: '18px', marginTop: '0', marginBottom: '12px' }}>Como Exercer seus Direitos</h3>
            <p style={{ marginBottom: '8px' }}><strong style={{ color: '#722F37' }}>E-mail:</strong> privacidade@gestantesapp.com</p>
            <p style={{ marginBottom: '8px' }}><strong style={{ color: '#722F37' }}>Telefone:</strong> (47) 3025-1500</p>
            <p style={{ marginBottom: '8px' }}><strong style={{ color: '#722F37' }}>Endereço:</strong> Rua Dona Francisca, 8300 - Zona Industrial Norte, Joinville - SC, 89219-600</p>
            <p style={{ marginBottom: '0' }}>Responderemos à sua solicitação no prazo estabelecido pela LGPD (15 dias, prorrogáveis por mais 15 dias).</p>
          </div>
        </section>

        <section>
          <h2 style={{ color: '#722F37', fontSize: '24px', marginTop: '40px', marginBottom: '15px', paddingBottom: '10px', borderBottom: '2px solid #C4A4A4' }}>7. Encarregado de Proteção de Dados (DPO)</h2>
          <p style={{ marginBottom: '15px', textAlign: 'justify' }}>Em conformidade com a LGPD, designamos um Encarregado de Proteção de Dados responsável por aceitar reclamações, prestar esclarecimentos e orientar sobre práticas de proteção de dados.</p>
          
          <div style={{ backgroundColor: '#f9f9f9', border: '1px solid #ddd', padding: '20px', margin: '20px 0', borderRadius: '5px' }}>
            <p style={{ marginBottom: '8px' }}><strong style={{ color: '#722F37' }}>Nome:</strong> Dr. André Luis Schlemper</p>
            <p style={{ marginBottom: '8px' }}><strong style={{ color: '#722F37' }}>E-mail:</strong> dpo@gestantesapp.com</p>
            <p style={{ marginBottom: '0' }}><strong style={{ color: '#722F37' }}>Telefone:</strong> (47) 3025-1500</p>
          </div>
        </section>

        <section>
          <h2 style={{ color: '#722F37', fontSize: '24px', marginTop: '40px', marginBottom: '15px', paddingBottom: '10px', borderBottom: '2px solid #C4A4A4' }}>8. Reclamações à ANPD</h2>
          <p style={{ marginBottom: '15px', textAlign: 'justify' }}>Se você acredita que seus direitos de proteção de dados foram violados, você tem o direito de apresentar uma reclamação à Autoridade Nacional de Proteção de Dados (ANPD):</p>
          <div style={{ backgroundColor: '#f9f9f9', border: '1px solid #ddd', padding: '20px', margin: '20px 0', borderRadius: '5px' }}>
            <p style={{ marginBottom: '8px' }}><strong style={{ color: '#722F37' }}>Autoridade Nacional de Proteção de Dados (ANPD)</strong></p>
            <p style={{ marginBottom: '0' }}><strong style={{ color: '#722F37' }}>Site:</strong> <a href="https://www.gov.br/anpd/" target="_blank" rel="noopener noreferrer" style={{ color: '#722F37', textDecoration: 'none' }}>https://www.gov.br/anpd/</a></p>
          </div>
        </section>

        <section>
          <h2 style={{ color: '#722F37', fontSize: '24px', marginTop: '40px', marginBottom: '15px', paddingBottom: '10px', borderBottom: '2px solid #C4A4A4' }}>9. Alterações nesta Política</h2>
          <p style={{ marginBottom: '15px', textAlign: 'justify' }}>Podemos atualizar esta Política de Privacidade periodicamente. Quando fizermos alterações significativas, notificaremos você através de aviso no aplicativo ou por e-mail. O uso continuado do aplicativo após as alterações constitui sua aceitação da política revisada.</p>
        </section>

        <section>
          <h2 style={{ color: '#722F37', fontSize: '24px', marginTop: '40px', marginBottom: '15px', paddingBottom: '10px', borderBottom: '2px solid #C4A4A4' }}>10. Informações de Contato</h2>
          <div style={{ backgroundColor: '#f9f9f9', border: '1px solid #ddd', padding: '20px', margin: '20px 0', borderRadius: '5px' }}>
            <p style={{ marginBottom: '8px' }}><strong style={{ color: '#722F37' }}>Clínica Mais Mulher</strong></p>
            <p style={{ marginBottom: '8px' }}><strong style={{ color: '#722F37' }}>Site:</strong> <a href="https://gestantesapp.com" target="_blank" rel="noopener noreferrer" style={{ color: '#722F37', textDecoration: 'none' }}>https://gestantesapp.com</a></p>
            <p style={{ marginBottom: '8px' }}><strong style={{ color: '#722F37' }}>E-mail de Privacidade:</strong> privacidade@gestantesapp.com</p>
            <p style={{ marginBottom: '8px' }}><strong style={{ color: '#722F37' }}>E-mail de Suporte:</strong> suporte@gestantesapp.com</p>
            <p style={{ marginBottom: '8px' }}><strong style={{ color: '#722F37' }}>Telefone:</strong> (47) 3025-1500</p>
            <p style={{ marginBottom: '0' }}><strong style={{ color: '#722F37' }}>Endereço:</strong> Rua Dona Francisca, 8300 - Zona Industrial Norte, Joinville - SC, 89219-600</p>
          </div>
        </section>

        <section>
          <h2 style={{ color: '#722F37', fontSize: '24px', marginTop: '40px', marginBottom: '15px', paddingBottom: '10px', borderBottom: '2px solid #C4A4A4' }}>11. Consentimento</h2>
          <div style={{ backgroundColor: '#F5E6C8', padding: '15px', borderLeft: '4px solid #722F37', margin: '20px 0' }}>
            <p style={{ marginBottom: '0' }}>Ao utilizar o App Mais Mulher - Acompanhamento Pré-Natal, você reconhece que leu, compreendeu e concorda com os termos desta Política de Privacidade. Você consente com a coleta, uso, armazenamento e compartilhamento de suas informações pessoais e de saúde conforme descrito nesta política.</p>
          </div>
        </section>

        <footer style={{
          textAlign: 'center',
          padding: '30px 20px',
          margin: '40px -20px -20px -20px',
          backgroundColor: '#f9f9f9',
          borderTop: '1px solid #ddd',
          fontSize: '14px',
          color: '#666'
        }}>
          <p><strong>Clínica Mais Mulher - Saúde Feminina</strong></p>
          <p>Data de vigência: 31 de dezembro de 2024</p>
          <p style={{ marginTop: '15px', fontSize: '12px' }}>© 2024 Clínica Mais Mulher. Todos os direitos reservados.</p>
        </footer>
      </div>
    </div>
  );
}
