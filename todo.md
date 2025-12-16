# TODO - APP Gestantes Mais Mulher

## Funcionalidades Principais

- [x] Sistema de autenticação com controle de acesso por roles (admin/user)
- [x] Cadastro completo de gestantes (dados pessoais, obstétricos e administrativos)
- [x] Cálculo automático de idade gestacional por DUM
- [x] Cálculo automático de idade gestacional por ultrassom
- [x] Cálculo automático da Data Provável do Parto (DPP)
- [x] Calculadora de marcos gestacionais importantes
- [x] Dashboard com listagem de gestantes
- [x] Sistema de busca e filtros avançados
- [x] Edição e exclusão de gestantes
- [x] Gestão de consultas pré-natais (estrutura backend)
- [x] Histórico completo de consultas (estrutura backend)
- [x] Registro de exames laboratoriais (estrutura backend)
- [x] Parâmetros estruturados de exames (estrutura backend)
- [x] Geração de cartão pré-natal em PDF
- [x] Gestão de planos de saúde (estrutura backend)
- [x] Gestão de médicos responsáveis (estrutura backend)
- [ ] Página de marcos importantes (UI completa)
- [ ] Previsão de partos por período (UI completa)
- [ ] Estatísticas e relatórios (UI completa)
- [x] Indicadores visuais por trimestre

## Funcionalidades Avançadas

- [ ] Alertas automáticos por email para marcos gestacionais
- [ ] Extração automática de dados de PDFs de exames com LLM
- [ ] Upload e armazenamento de documentos em S3
- [ ] Armazenamento de guias de exames
- [ ] Armazenamento de cartões pré-natais
- [ ] Armazenamento de documentos das gestantes

## Migração de Dados

- [x] Migrar dados de planos de saúde
- [x] Migrar dados de médicos
- [ ] Migrar dados de gestantes do projeto original (estrutura pronta)
- [ ] Migrar dados de consultas pré-natais (estrutura pronta)
- [ ] Migrar dados de exames laboratoriais (estrutura pronta)
- [ ] Migrar credenciais HILUM (estrutura pronta)

## Design e UX

- [x] Aplicar paleta de cores da clínica (vinho marsala e bege/pêssego)
- [x] Adicionar logo da clínica Mais Mulher
- [x] Interface responsiva e intuitiva
- [x] Indicadores coloridos por trimestre


## Réplica Exata do Projeto Original

- [x] Implementar página de Marcos Importantes completa
- [x] Implementar página de Previsão de Partos completa
- [x] Implementar página de Exames Laboratoriais completa
- [ ] Implementar página de Exames Estruturados completa
- [ ] Implementar página de Cartão Pré-Natal com geração de PDF
- [ ] Implementar página de Estatísticas completa
- [x] Implementar página de Gerenciar Planos completa
- [x] Implementar página de Gerenciar Médicos completa
- [ ] Implementar página de Agendamento de Consultas pré-natais
- [ ] Adicionar todas as funcionalidades de cálculo de datas
- [ ] Replicar exatamente o design e cores do original


## Atualização de Logo

- [x] Substituir logo atual pelos logos oficiais da clínica Mais Mulher
- [x] Usar logo horizontal no sidebar
- [x] Usar logo vertical na landing page
- [ ] Atualizar favicon com o logo


## Migração de Dados do Site Atual

- [x] Importar dados de usuários
- [x] Importar dados de gestantes (113 gestantes)
- [x] Importar dados de médicos (4 médicos)
- [ ] Importar dados de consultas pré-natais (requer adaptação de schema)
- [ ] Importar dados de agendamentos de consultas (requer adaptação de schema)
- [ ] Importar dados de exames laboratoriais (requer adaptação de schema)
- [ ] Importar dados de exames laboratoriais estruturados (requer adaptação de schema)
- [x] Validar integridade dos dados migrados


## Melhorias de Navegação

- [x] Adicionar botão "Voltar" no topo de cada página
- [ ] Implementar navegação breadcrumb para melhor UX

## Página de Estatísticas

- [x] Implementar gráfico de distribuição por trimestre (Distribuição de Partos por Mês)
- [x] Implementar gráfico de distribuição por tipo de parto
- [x] Implementar gráfico de distribuição por convênio
- [x] Implementar gráfico de morfológicos por mês


## Correção de Bugs

- [x] Investigar por que o dashboard mostra 105 gestantes ao invés de 113
- [x] Remover filtro por userId para permitir visualização compartilhada de todas as gestantes
- [x] Atualizar todas as queries para não filtrar por usuário
- [x] Validar que todas as 113 gestantes aparecem no dashboard


## Ajustes de Títulos e Navegação

- [x] Ajustar títulos das abas do menu lateral para ficarem idênticos ao site original
- [ ] Ajustar títulos das páginas para ficarem idênticos ao site original
- [ ] Verificar nomenclatura em todas as páginas

## Funcionalidade de Cartão Pré-Natal

- [x] Implementar página completa de Cartão Pré-Natal
- [x] Incluir IG calculada por DUM e Ultrassom
- [x] Exibir Idade ao invés de Data de Nascimento
- [x] Apresentar Histórico Obstétrico em linha única
- [ ] Adicionar geração de PDF do cartão pré-natal
- [ ] Incluir logo da clínica no PDF


## Melhorias de UX

- [x] Ordenar gestantes alfabeticamente no seletor do Cartão de Pré-Natal

- [x] Adicionar função de busca no seletor de gestantes do Cartão de Pré-Natal


## Sistema de Alertas de Partos Próximos

- [x] Adicionar campo dataPartoProgramado no schema e formulários
- [x] Implementar lógica de priorização (1º Parto Programado, 2º DPP USG, 3º DPP DUM)
- [x] Adicionar códigos de cores para indicar urgência dos alertas
- [x] Criar componente de alertas no Dashboard para próximos 21 dias
- [x] Exibir alertas ordenados por proximidade da data
- [x] Incluir informações da gestante e tipo de parto nos alertas


## Ajuste de Layout dos Alertas

- [x] Ajustar layout dos alertas para formato compacto em linha única
- [x] Adicionar informações do médico responsável nos alertas
- [x] Ajustar cores dos badges de dias (laranja para urgente, verde para distante)
- [x] Adicionar ícone de calendário antes da data
- [x] Importar datas de partos programados do CSV atualizado (13 datas importadas)


## Correção de Cálculo DPP Ultrassom

- [x] Investigar diferença no cálculo da DPP pelo Ultrassom (Paula Marques)
- [x] Corrigir fórmula de cálculo da DPP pelo US para ficar idêntica ao site original (+1 dia)
- [x] Validar cálculo com dados de teste (Paula Marques: US 20/05/2025, IG 7s6d = DPP 31/12/2025)


## Ajuste de Design dos Alertas

- [ ] Ajustar cores dos badges de dias para ficarem idênticas ao site original
- [ ] Ajustar formato e estilo das bordas dos alertas
- [ ] Ajustar tamanhos e organização dos textos
- [ ] Replicar layout exato do print do site original


## Marcos Importantes e Cartão de Pré-Natal

- [x] Implementar todos os 9 marcos importantes (Concepção, Morfológico 1º Tri, 13 Semanas, Morfológico 2º Tri, Vacina dTpa, Vacina Bronquiolite, Termo Precoce, Termo Completo, DPP 40 semanas)
- [x] Adicionar períodos de datas nos marcos que precisam (Morfológico 1º Tri, Morfológico 2º Tri, Vacina Bronquiolite)
- [x] Adicionar seção de Marcos Importantes no Cartão de Pré-Natal (abaixo das consultas)
- [x] Implementar botões de copiar em cada marco no Cartão de Pré-Natal
- [x] Atualizar layout de informações da gestante no Cartão de Pré-Natal para ficar idêntico ao print original
- [x] Garantir que marcos no Cartão sempre usam DPP pelo US
- [x] Adicionar cálculo de DPP pelo US no backend (campo dppUS no objeto calculado)


## Bugs no Cartão de Pré-Natal (Reportados 09/12/2025)

- [x] Corrigir exibição de dados Gesta/Para no card de Dados da Gestante
- [x] Corrigir exibição de consultas no Histórico de Consultas (consulta importada do CSV)
- [x] Corrigir exibição dos Marcos Importantes (não aparecem mesmo com dados de ultrassom)
- [x] Ajustar formato do texto copiado dos marcos para "DD/MM a DD/MM/AAAA" em períodos
- [x] Verificar se campos Gesta/Para estão sendo retornados pelo backend


## Redesign da Página de Gestantes (Solicitado 09/12/2025)

- [x] Adicionar campo de busca por nome no topo
- [x] Adicionar dropdown "Tipo de parto desejado" (normal, cesárea, todos)
- [x] Adicionar dropdown "Parto será realizado por" (lista de médicos)
- [x] Adicionar dropdown "Plano de Saúde" (lista de planos)
- [x] Adicionar filtro de período de DPP (data inicial e final)
- [x] Redesenhar tabela com coluna # (número sequencial)
- [x] Adicionar coluna IG (DUM) com badge colorido (semanas+dias + trimestre)
- [x] Adicionar coluna DPP (DUM) com data formatada
- [x] Adicionar coluna IG (US) com badge colorido (quando disponível)
- [x] Adicionar coluna DPP (US) com data formatada (quando disponível)
- [x] Implementar badges coloridos por trimestre (verde=1º, azul=2º, rosa=3º)
- [x] Atualizar backend para calcular e retornar IG (DUM) e IG (US)
- [x] Implementar lógica de filtros no backend


## Ajustes de UX nos Filtros (Solicitado 09/12/2025)

- [x] Alterar placeholder "Todos os tipos" para "Tipo de parto"
- [x] Alterar placeholder "Todos os planos" para "Plano de saúde"
- [x] Alterar placeholder "Todos os médicos" para "Médico"


## Alteração de Título (Solicitado 09/12/2025)

- [ ] Alterar título de "APP Gestantes - Mais Mulher" para "Gestão de Pré-Natal da Clínica Mais Mulher"


## Autocomplete de Busca por Nome (Solicitado 09/12/2025)

- [x] Implementar autocomplete com sugestões na página de Gestantes (Filtros e Busca)
- [x] Implementar autocomplete com sugestões na página de Marcos Importantes (seletor de gestante)
- [x] Implementar autocomplete com sugestões na página de Cartão de Pré-Natal (seletor de gestante)
- [x] Mostrar dropdown com nomes compatíveis ao digitar
- [x] Permitir clicar diretamente no nome sugerido


## Atualização do Formulário de Edição de Gestante (Solicitado 09/12/2025)

- [x] Verificar se campo "observacoes" existe no schema
- [x] Adicionar campo "observacoes" ao schema
- [x] Adicionar campo "E-mail" no formulário (já existe)
- [x] Adicionar campo "Data Planejada para o Parto" no formulário
- [x] Adicionar campo "Observações" (textarea) no formulário
- [x] Garantir que todos os campos do print original estão presentes
- [x] Testar salvamento de todos os campos


## Melhorias no Cartão de Pré-Natal (Solicitado 09/12/2025)

- [x] Adicionar botões de copiar em TODOS os marcos importantes (já implementado)
- [x] Ajustar badges BCF e MF para verde com texto "Sim"
- [x] Mostrar IG DUM e IG US na mesma célula do histórico de consultas (duas linhas)
- [x] Adicionar campo MF (Movimento Fetal) ao schema e formulário
- [x] Adicionar coluna Observações na tabela de histórico
- [x] Implementar botão de editar consulta funcional (ícone de lápis)
- [x] Criar formulário de edição de consulta (já existe)
- [x] Testar todas as melhorias no navegador


## Card de Idade Gestacional no Formulário de Consulta (Solicitado 09/12/2025)

- [x] Adicionar card "Idade Gestacional" no formulário de Nova Consulta
- [x] Mostrar IG pela DUM calculada automaticamente (X semanas e X dias)
- [x] Mostrar IG pelo Ultrassom calculada automaticamente (X semanas e X dias)
- [x] Atualizar cálculo quando a data da consulta mudar (automático via React)
- [x] Testar com diferentes datas de consulta


## Bug de Datas DPP (Reportado 09/12/2025)

- [x] Investigar por que DPP pela DUM está aparecendo 1 dia antes
- [x] Investigar por que DPP pelo US está aparecendo 1 dia antes
- [x] Corrigir problema de fuso horário nos cálculos de data (instanceof Date check)
- [x] Testar com exemplos reais - Vivian agora mostra datas (antes era NaN)
- [ ] Aguardando confirmação do usuário se datas estão corretas ou ainda 1 dia antes


## Gráfico de Curva de Peso no Cartão de Pré-Natal (Solicitado 09/12/2025)

- [x] Instalar biblioteca de gráficos (Recharts)
- [x] Criar componente GraficoPeso.tsx
- [x] Buscar dados de peso de todas as consultas da gestante
- [x] Calcular IMC pré-gestacional da gestante
- [x] Calcular curva de ganho ponderal ideal baseado no IMC
- [x] Plotar pontos de peso real das consultas
- [x] Plotar linha de referência do ganho ideal
- [x] Adicionar labels e tooltips informativos
- [x] Integrar gráfico no Cartão de Pré-Natal (após histórico de consultas)
- [x] Testar com dados reais da Vivian
- [x] Adicionar campos altura e pesoInicial ao formulário de cadastro/edição de gestantes
- [x] Implementar área sombreada mostrando faixa ideal de ganho de peso
- [x] Diferenciar cores por categoria de IMC (baixo peso, adequado, sobrepeso, obesidade)
- [x] Validar funcionamento completo com dados da Vivian (IMC 21.3, Peso Adequado)


## Bugs Críticos Reportados (09/12/2025 - 21:30)

- [x] Investigar por que histórico de consultas da Graziela Mazoni sumiu - RESOLVIDO: Ela nunca teve consultas cadastradas no banco
- [x] Verificar se outras gestantes também perderam consultas - RESOLVIDO: Apenas Vivian tem consulta no banco (1 consulta)
- [x] Corrigir problema de fuso horário em datas programadas (ex: 15/12 aparece como 14/12) - RESOLVIDO: parseLocalDate agora retorna string diretamente
- [x] Corrigir problema de fuso horário em todas as datas do sistema (DUM, dataUltrassom, dataPartoProgramado, dataConsulta) - RESOLVIDO
- [x] Validar que todas as datas estão sendo salvas e exibidas corretamente - RESOLVIDO: Graziela agora mostra 15/12/2025 corretamente


## Copiar Agendamento de Consultas do Site Original (Solicitado 10/12/2025)

- [x] Acessar arquivo agendamentoConsultas.ts do site original
- [x] Analisar e documentar a lógica de cálculo de datas
- [x] Extrair regras de sugestão de consultas (ultrassom, cardiotocografia)
- [x] Identificar semanas gestacionais específicas para cada tipo de consulta
- [x] Implementar a mesma lógica no novo projeto (server/agendamento.ts)
- [x] Criar schema de banco (tabela agendamentosConsultas)
- [x] Implementar procedures tRPC (calcular, list, updateStatus, deletar)
- [x] Criar página frontend AgendamentoConsultas.tsx
- [x] Adicionar rota /agendamento-consultas no App.tsx
- [x] Adaptar layout visual para seguir padrão do novo projeto (botão voltar, cards, etc)
- [x] Testar lógica de backend com vitest - PASSOU (7 consultas calculadas corretamente)
- [ ] BUG: Botão "Calcular Agendamentos" não dispara evento onClick no frontend
- [ ] Debugar e corrigir problema de evento onClick
- [ ] Testar com dados reais de gestantes após correção do bug
- [ ] Validar que as datas sugeridas são idênticas ao site original


## Bug nos Alertas do Dashboard (Reportado 10/12/2025 - 01:05)

- [x] Verificar data da Graziela Mazoni no banco de dados - RESOLVIDO: Data correta (2025-12-15)
- [x] Investigar código dos alertas no dashboard (AlertasPartosProximos.tsx) - RESOLVIDO: Problema na conversão de string para Date
- [x] Corrigir problema de fuso horário na exibição das datas nos alertas - RESOLVIDO: Adicionada função parseLocalDate
- [x] Validar que a data 15/12 aparece corretamente nos alertas - RESOLVIDO: Graziela agora mostra 15/12/2025


## Importação de Consultas Pré-Natais (Solicitado 10/12/2025 - 01:15)

- [x] Ler e analisar arquivo CSV de consultas atualizado (77 consultas no arquivo)
- [x] Criar script de importação de consultas (Python com mysql-connector)
- [x] Mapear IDs de gestantes do CSV para IDs do novo banco (usando nome como chave)
- [x] Executar importação de todas as consultas
- [x] Validar quantidade de consultas importadas (48 importadas, 28 sem gestante correspondente)
- [x] Testar visualização no Cartão Pré-Natal - SUCESSO: Graziela Mazoni mostra 2 consultas


## Sistema de E-mails Automáticos para Gestantes (Solicitado 10/12/2025 - 04:30)

### Lembretes Implementados:
- Vacina dTpa: exatamente com 27 semanas
- Vacina Bronquiolite: com 32 semanas
- Morfológico 1º Tri: com 10 semanas (1 semana antes de 11-14 semanas)
- Morfológico 2º Tri: com 18 e 19 semanas (2 e 1 semana antes de 20-24 semanas)

### Tarefas:
- [x] Instalar e configurar Nodemailer para Gmail
- [x] Criar tabela no banco para armazenar configurações de e-mail (configuracoesEmail)
- [x] Criar tabela para log de e-mails enviados (logsEmails)
- [x] Implementar templates de e-mail com rodapé padrão de notificação (server/email.ts)
- [x] Criar função para calcular datas de lembretes baseado em DUM/IG (server/lembretes.ts)
- [x] Implementar procedures tRPC (email.configurar, processarLembretes, logs)
- [x] Criar interface para configurar credenciais do Gmail (/gerenciar-emails)
- [x] Adicionar campo de e-mail no cadastro de gestantes (já existia)
- [x] Configurar credenciais do Gmail (prenatalmaismulher@gmail.com)
- [x] Testar envio de e-mails com conta Gmail do usuário - SUCESSO: E-mail de dTpa enviado
- [x] Validar que e-mails não são enviados duplicados (tabela logsEmails + verificação)
- [ ] Implementar job automático diário (opcional - pode ser executado manualmente)


## Bug: E-mail Não Recebido (Reportado 10/12/2025 - 06:15)

- [x] Verificar logs de e-mail no banco de dados - Log mostrava "enviado" sem erros
- [x] Verificar se há mensagem de erro no log - Sem erros
- [x] Testar conexão SMTP com Gmail - RESOLVIDO: Senha precisava incluir espaços
- [x] Verificar se senha de app está correta - RESOLVIDO: Senha correta é 'wawz fmyc gwgp tjcj' (com espaços)
- [x] Corrigir formato da tabela configuracoesEmail (chave-valor)
- [x] Corrigir código email.ts para usar chaves corretas (smtp_email, smtp_senha)
- [x] Reenviar e-mail de teste - SUCESSO: E-mail de dTpa enviado
- [ ] Aguardando confirmação do usuário sobre recebimento


## Adicionar Logotipo nos E-mails (Solicitado 10/12/2025 - 07:00)

- [x] Fazer upload do logotipo para S3 (LogoMaisMulher.png)
- [x] Atualizar templates de e-mail com o logotipo no cabeçalho
- [x] Testar envio de e-mail com logotipo - SUCESSO
- [x] Validar que o logotipo aparece corretamente - CONFIRMADO pelo usuário


## Atualizar Textos de E-mails de Vacinas (Solicitado 10/12/2025 - 07:10)

- [x] Atualizar texto da vacina dTpa para orientar procurar clínica de vacinação e mencionar SUS
- [x] Atualizar texto da vacina de Bronquiolite para orientar procurar clínica de vacinação e mencionar SUS
- [x] Adicionar mensagem verde com 💚 sobre disponibilidade no SUS


## Migrar Sistema de E-mails para Resend (Solicitado 10/12/2025 - 07:30)

- [ ] Instalar biblioteca resend
- [ ] Atualizar código email.ts para usar Resend API
- [ ] Configurar chave API do Resend no banco
- [ ] Testar envio de e-mail com Resend
- [ ] Validar recebimento em ambos os e-mails (Yahoo e iCloud)

## Melhorias na Página de Exames Laboratoriais (Solicitado 10/12/2025)

- [x] Substituir checkboxes por campos de texto para inserir resultados de exames
- [x] Mostrar apenas trimestres relevantes para cada exame (não mostrar campos vazios)
- [x] Definir quais exames são solicitados em quais trimestres baseado no protocolo pré-natal
- [ ] Atualizar schema do banco para armazenar resultados de exames
- [ ] Implementar backend para salvar e recuperar resultados de exames


- [x] IgM de Toxoplasmose, Rubéola e Citomegalovírus em 2º e 3º trimestres
- [x] Separar IgG e IgM em linhas diferentes
- [x] EPF apenas no 1º trimestre
- [x] Dividir Hemograma em Hemoglobina/Hematócrito e Plaquetas
- [x] TTGO com 3 campos (Jejum, 1h, 2h)

- [ ] Remover HIV do 2º trimestre
- [ ] IgG de Toxoplasmose, Rubéola, Citomegalovírus e FTA-ABS nos 3 trimestres
- [ ] Adicionar campo de texto livre "Outros Exames"
- [x] Adicionar Proteinúria de 24 horas no 3º trimestre
- [ ] Criar tabela no banco para armazenar resultados de exames
- [ ] Implementar tRPC procedures para salvar e recuperar resultados
- [ ] Conectar botão "Salvar Resultados" ao backend


## Ajuste de Ordem dos Exames Laboratoriais (Solicitado 10/12/2025)

- [x] Mover Tipagem Sanguínea ABO/Rh para o topo da lista de exames


## Ajuste de Ordem dos Exames - Parte 2 (Solicitado 10/12/2025)

- [x] Mover Coombs indireto para segunda posição (logo após Tipagem Sanguínea)
- [x] Mover FTA-ABS IgG e IgM para logo abaixo de VDRL


## Ajuste de Trimestres - Glicemia de Jejum (Solicitado 10/12/2025)

- [x] Remover Glicemia de jejum do 3º trimestre (manter apenas 1º trimestre)


## Ajuste de Nomenclatura - Outros Exames (Solicitado 10/12/2025)

- [x] Alterar título "Outros Exames" para "Pesquisa para E.G.B."


## Atualização em Massa - Dados Antropométricos (Solicitado 10/12/2025)

- [x] Atualizar todas as gestantes com altura de 165cm e peso inicial de 60kg para habilitar gráficos de ganho de peso


## Interpretação Automática de Exames por IA (Solicitado 10/12/2025)

- [x] Criar backend para processar upload de PDF/imagem e extrair dados com IA
- [x] Criar interface de upload com modal para seleção de trimestre (1º, 2º ou 3º)
- [x] Implementar preenchimento automático dos campos de exames (exceto "Observações / Outros Exames")
- [ ] Testar com PDFs e imagens de exames reais
- [x] Escrever testes automatizados


## Sistema de Destaque de Valores Anormais em Exames (Solicitado 10/12/2025)

- [x] Analisar PDF de valores de referência e extrair faixas normais por trimestre
- [x] Criar arquivo de configuração com faixas de referência para cada exame
- [x] Implementar função de validação de resultados (comparar valor com faixa normal)
- [x] Adicionar destaque visual para valores fora da faixa (cor vermelha/laranja + ícone de alerta)
- [x] Implementar destaque especial para RH negativo na tipagem sanguínea
- [x] Testar com dados reais de exames


## Correção do Gráfico de Ganho de Peso (Reportado 10/12/2025)

- [x] Corrigir eixo Y para mostrar valores em kg (peso absoluto) ao invés de ganho de peso
- [x] Corrigir sobreposição de textos nas legendas abaixo do gráfico
- [x] Melhorar espaçamento e rotação das legendas
- [x] Testar visualização no navegador


## Bug de Salvamento de Peso Inicial (Reportado 10/12/2025)

- [x] Investigar por que alteração de peso inicial não é salva no banco
- [x] Verificar se campo pesoInicial está sendo enviado ao backend
- [x] Corrigir procedure tRPC de edição de gestante (adicionar altura e pesoInicial ao schema)
- [x] Testar salvamento e verificar reflexo no gráfico (Débora: 81kg salvo e gráfico atualizado)


## Nova Aba de Ultrassons (Solicitado 10/12/2025)

- [x] Criar schema de banco para tabela ultrassons (6 tipos: 1º US, Morfo 1º Tri, US Obstétrico, Morfo 2º Tri, Ecocardiograma, US Seguimento)
- [x] Criar procedures tRPC para salvar e carregar ultrassons
- [x] Criar página frontend Ultrassons.tsx similar à de Exames Laboratoriais
- [x] Implementar formulários para cada tipo de ultrassom com campos específicos
- [x] Adicionar rota /ultrassons no App.tsx e menu lateral
- [x] Testar salvamento e carregamento de dados no navegador
- [x] Escrever testes automatizados (7 testes passando)


## Inversão de Ordem das Consultas no Cartão de Pré-Natal (Solicitado 10/12/2025)

- [x] Investigar ordenação atual das consultas no backend (desc em db.ts linha 279)
- [x] Alterar ordenação para crescente (ASC) por data (primeira consulta no topo)
- [x] Testar visualização no Cartão de Pré-Natal


## Melhorias no Cart\u00e3o Pr\u00e9-Natal e Exame## Melhorias no Cartão Pré-Natal e Exames Laboratoriais (Solicitado 10/12/2025)

- [x] Adicionar opção "Úter--snip--o não palpável" no campo Altura Uterina (AUF) do Cartão Pré-Natal
- [x] Adicionar exame Anti-HBs nos 3 trimestres na configuração de exames laboratoriais
- [x] Implementar validação de Anti-HBs (Reagente = verde normal, Não Reagente = vermelho crítico)
- [x] Atualizar interpretação por IA para incluir Anti-HBs
- [ ] Adicionar campo de data para cada exame laboratorial registrado (backend pronto, falta frontend)
- [x] Testar todas as alterações no navegadorar todas as altera\u00e7\u00f5es no navegador


## Melhorias na Página de Ultrassons (Solicitado 10/12/2025)

- [x] Adicionar botão "Voltar" na página de Ultrassons para consistência com outras páginas
- [x] Criar backend para interpretar laudos de ultrassom com IA (similar aos exames laboratoriais)
- [x] Criar modal de upload de PDF/imagem de laudos de ultrassom
- [x] Implementar preenchimento automático dos campos de ultrassom baseado na interpretação da IA
- [x] Adicionar seleção de tipo de ultrassom no modal (1º US, Morfo 1º Tri, US Obstétrico, Morfo 2º Tri, Ecocardiograma, US Seguimento)
- [x] Testar com laudos reais de ultrassom (7 testes automatizados passando)
- [x] Escrever testes automatizados (7 testes em interpretarUltrassom.test.ts)


## Adicionar Data de Coleta aos Exames Laboratoriais (Solicitado 10/12/2025)

- [x] Adicionar campo de data de coleta para cada exame na interface
- [x] Atualizar lógica de salvamento para incluir datas
- [x] Atualizar lógica de carregamento para exibir datas
- [x] Testar salvamento e carregamento de datas no navegador
- [x] Atualizar testes automatizados para validar datas (4 testes passando em examesLab.dataColeta.test.ts)


## Correção de Acentuação no Cartão de Pré-Natal (Reportado 10/12/2025)

- [x] Corrigir texto "Útero não palpável" no campo AUF que estava com problema de acentuação (estava como "Úter--snip--o")
- [x] Testar visualização no navegador (dropdown e tabela corrigidos)


## Data de Coleta por Trimestre nos Exames Laboratoriais (Solicitado 10/12/2025)

- [x] Atualizar schema do banco para suportar data específica por trimestre (já suportava: dataExame + trimestre)
- [x] Atualizar backend (routers.ts) para salvar e carregar datas por trimestre
- [x] Atualizar interface para mostrar campo de data em cada trimestre
- [x] Atualizar IA para extrair datas dos exames de PDFs/fotos (schema e retorno atualizados)
- [x] Atualizar dados da Camila Sidrin com data 11/11/2025 em todos os exames registrados (22 exames)
- [x] Testar salvamento e carregamento de datas por trimestre (validado no navegador)


## Padronização de Nomenclatura - NEG para Não Reagente (Solicitado 10/12/2025)

- [x] Identificar todos os campos que usam "NEG" ou "Negativo" (14 exames sorológicos)
- [x] Trocar para "Não reagente" em toda a interface (dropdowns implementados)
- [x] Garantir que todos os campos tenham apenas duas opções: "Reagente" ou "Não reagente"
- [x] Atualizar validações e destaques visuais para usar nova nomenclatura
- [x] Atualizar IA para interpretar e retornar "Não reagente" ao invés de "NEG"
- [x] Testar todas as alterações no navegador (validado com Camila Sidrin)


## Adicionar Botão Voltar na Página de Exames Laboratoriais (Reportado 10/12/2025)

- [x] Adicionar botão "Voltar" no topo da página de Exames Laboratoriais
- [x] Manter consistência visual com outras páginas


## Migração de Dados - NEG para Não Reagente (Solicitado 10/12/2025)

- [x] Criar script SQL para identificar registros com "NEG" (22 registros encontrados)
- [x] Executar UPDATE para converter "NEG" para "Não reagente"
- [x] Validar que todos os registros foram atualizados corretamente (0 NEG restantes, 22 com "Não reagente")
- [x] Documentar quantidade de registros migrados (22 registros)


## Reorganização de Colunas - Exames Laboratoriais (Solicitado 10/12/2025)

- [x] Atualizar cabeçalho da tabela para 7 colunas (Nome, Data 1º, Resultado 1º, Data 2º, Resultado 2º, Data 3º, Resultado 3º)
- [x] Reorganizar renderização dos campos para separar data e resultado em colunas distintas
- [x] Testar visualização no navegador (validado com Camila Sidrin)


## Correção de Erro React - Key Prop (Reportado 10/12/2025)

- [x] Identificar elementos sem key prop na renderização de exames (Fragment sem key em exames com subcampos)
- [x] Adicionar key prop única para cada elemento da lista (React.Fragment key={exame.nome})
- [x] Testar no navegador para confirmar que o erro foi resolvido (sem erros no console)


## Correção de Interpretação de TOTG pela IA (Reportado 10/12/2025)

- [ ] Analisar PDF de exemplo (Patricia.pdf) para identificar formato dos dados
- [ ] Identificar por que a IA não está extraindo valores de TOTG corretamente
- [ ] Corrigir prompt e schema da IA para melhorar extração de TOTG
- [ ] Testar com PDF real no navegador
- [ ] Atualizar testes automatizados para validar TOTG


## Correção de Bug do TTGO (10/12/2025)

- [x] Investigar por que TTGO não estava sendo preenchido pela IA
- [x] Identificar incompatibilidade de chaves entre backend e frontend
- [x] Corrigir componente frontend para acessar estrutura correta dos subcampos
- [x] Validar que os 3 subcampos do TTGO (Jejum, 1h, 2h) são preenchidos corretamente
- [x] Remover logs de debug após correção


## Melhorias e Correções Solicitadas (10/12/2025)

- [x] Simplificar EAS (Urina tipo 1) para NORMAL (verde) ou ALTERADO (amarelo)
- [x] Simplificar Urocultura para POSITIVA (vermelho) ou NEGATIVA (verde)
- [x] Corrigir menu lateral sumindo nas páginas de Ultrassom e Agendamento de Consultas
- [x] Padronizar botão Voltar em todas as páginas (mesmo estilo e posição)
- [x] Investigar e corrigir bug do MF não salvando nas consultas pré-natais
- [x] Melhorar gráfico de peso para mostrar evidentemente quanto está acima/abaixo da curva


## Bug do Gráfico de Peso com pesoInicial NULL (Reportado 10/12/2025)

- [x] Corrigir tratamento de pesoInicial NULL no CartaoPrenatal.tsx para evitar divisão NULL/1000
- [x] Garantir que gráfico mostra mensagem "Dados insuficientes" quando pesoInicial for NULL


## Geração de PDF do Cartão Pré-natal (Solicitado 10/12/2025)

- [ ] Instalar biblioteca de geração de PDF (PDFKit ou similar)
- [ ] Preparar logo da clínica em formato adequado para PDF
- [ ] Criar endpoint backend para geração do PDF (tRPC procedure)
- [ ] Implementar layout do PDF com cabeçalho e logo
- [ ] Adicionar seção de dados da gestante no PDF
- [ ] Adicionar seção de histórico de consultas no PDF
- [ ] Adicionar seção de marcos importantes no PDF
- [ ] Adicionar seção de ultrassons no PDF
- [ ] Adicionar seção de exames laboratoriais no PDF
- [ ] Adicionar gráfico de evolução de peso no PDF (se disponível)
- [ ] Criar botão "Gerar PDF" ao final da página do Cartão Pré-natal
- [ ] Testar geração de PDF com dados reais de gestantes


## Melhoria do PDF do Cartão Pré-natal (10/12/2025)
- [x] Carregar dados de ultrassons cadastrados
- [x] Carregar dados de exames laboratoriais cadastrados
- [x] Adicionar seção de Ultrassons ao PDF
- [x] Adicionar seção de Exames Laboratoriais ao PDF
- [x] Testar PDF com dados completos (Camila Zanco não tem ultrassons/exames cadastrados)


## Correção de Erros Críticos (11/12/2025)

- [x] Corrigir procedure tRPC inexistente: `exames.listByGestante`
- [x] Corrigir procedure tRPC inexistente: `ultrassons.list`
- [x] Corrigir erro de cores OKLCH no html2canvas (componente CartaoPrenatalPDF)
- [x] Corrigir warning de key prop no componente Line do gráfico


## Melhorias no PDF do Cartão Pré-natal (11/12/2025)

- [x] Adicionar tabela de exames laboratoriais ao PDF
- [x] Adicionar tabela de ultrassons ao PDF
- [x] Formatar tabelas com bordas e cabeçalhos
- [x] Testar PDF com dados reais de gestantes


## Adicionar Logo ao PDF do Cartão Pré-natal (11/12/2025)

- [x] Localizar arquivo do logo da clínica Mais Mulher
- [x] Converter logo para formato compatível com jsPDF (base64 ou URL)
- [x] Adicionar logo ao cabeçalho do PDF
- [x] Ajustar layout do cabeçalho para acomodar logo e título
- [x] Testar PDF com logo em diferentes tamanhos


## Correção de Logo no PDF (11/12/2025)

- [x] Verificar dimensões originais do logo horizontal
- [x] Ajustar proporções do logo no PDF para evitar distorção
- [x] Aumentar tamanho do logo mantendo aspect ratio
- [x] Testar PDF com logo corrigido

## Correções no Histórico de Consultas do PDF (11/12/2025)

- [x] Corrigir formatação do peso (mostrar em kg ao invés de gramas)
- [x] Adicionar coluna BCF no histórico de consultas
- [x] Adicionar coluna MF no histórico de consultas
- [x] Testar PDF com todas as correções


## Reformatar Dados Obstétricos no PDF (11/12/2025)

- [x] Implementar notação médica padrão para dados obstétricos (ex: G5P3(2PC1PN)A1)
- [x] Substituir linhas separadas por formato compacto em uma linha
- [x] Testar PDF com nova formatação


## Melhorias no PDF - Logo e IG (11/12/2025)

- [x] Aumentar tamanho do logo no PDF
- [x] Adicionar mais espaçamento abaixo do logo
- [x] Adicionar coluna IG (Idade Gestacional) no histórico de consultas do PDF
- [x] Testar PDF com todas as melhorias


## Adicionar Marcos Importantes ao PDF (11/12/2025)

- [x] Verificar estrutura e cores dos marcos importantes no aplicativo
- [x] Mapear cores RGB dos marcos para uso no PDF
- [x] Implementar seção de Marcos Importantes no PDF com cores
- [x] Testar PDF com Marcos Importantes coloridos


## Melhorias no Layout do PDF (11/12/2025)

- [x] Mover título "Cartão de Pré-Natal" para baixo do logotipo
- [x] Adicionar idade da gestante na mesma linha do nome
- [x] Organizar marcos importantes em 2 colunas (2 por linha)
- [x] Abrir PDF em nova aba para visualização antes de baixar


## Correção do Cálculo de Idade da Gestante (11/12/2025)

- [x] Investigar onde a idade é calculada no backend (campo calculado.idade)
- [x] Implementar cálculo correto baseado na data de nascimento
- [x] Testar PDF para verificar se idade aparece corretamente


## Melhorias no Gráfico de Acompanhamento de Peso (11/12/2025)

- [x] Adicionar peso da consulta por escrito no gráfico (simplificado - apenas peso)
- [x] Testar gráfico para verificar se labels aparecem corretamente


## Padronização Visual e de Navegação (11/12/2025)

- [x] Suavizar cores dos marcos importantes no PDF (estão muito intensas)
- [x] Ajustar posição do título na página Cartão de Pré-natal para ficar igual às outras
- [x] Adicionar botão Voltar na página Gerenciar Planos
- [x] Adicionar botão Voltar na página Gerenciar Médicos
- [x] Testar navegação em todas as páginas
- [x] Testar PDF com cores suavizadas


## Ajustes de Layout no PDF e Página (11/12/2025)

- [x] Aumentar espaçamento entre logotipo e título "Cartão de Pré-natal" no PDF
- [x] Centralizar logotipo no topo do PDF
- [x] Testar PDF com ajustes de espaçamento e centralização
- [x] Corrigir posicionamento do título na página Cartão de Pré-natal (adicionar mb-2)


## Ajuste Fino de Espaçamento - Cabeçalho Cartão de Pré-natal (11/12/2025)

- [x] Comparar estrutura HTML completa entre Cartão de Pré-natal e Exames Laboratoriais
- [x] Identificar todas as diferenças de classes CSS e espaçamentos
- [x] Ajustar Cartão de Pré-natal para ficar exatamente igual (remover container mx-auto py-6)
- [x] Testar e comparar visualmente lado a lado


## Ajuste de Valores NULL no PDF (11/12/2025)

- [x] Localizar código de geração do histórico de consultas no PDF
- [x] Ajustar exibição de PA (Pressão Arterial) para mostrar "-" quando NULL
- [x] Ajustar exibição de AU (Altura Uterina) para mostrar "-" quando NULL (com conversão mm para cm)
- [x] Testar PDF com consultas

## Organização de Submenu - CONCLUÍDO (11/12/2025)

- [x] Adicionar submenu "Configurações" no menu lateral do GestantesLayout
- [x] Criar estrutura expansível com seta para mostrar/ocultar submenus
- [x] Incluir "Gerenciar Planos" e "Gerenciar Médicos" como itens do submenu
- [x] Manter as páginas originais sem modificações
- [x] Testar navegação e funcionamento completo

## Integração WhatsApp Helena - Lembretes de Vacina (11/12/2025)

### Backend
- [x] Adicionar campo "telefone" na tabela gestantes (já existia)
- [x] Criar tabela "mensagens_enviadas" para histórico
- [x] Configurar credenciais da API Helena (token como secret)
- [x] Criar helper de integração com API Helena
- [x] Criar endpoint tRPC para enviar lembrete de vacina
- [x] Criar endpoint tRPC para listar histórico de mensagens

### Frontend
- [x] Adicionar campo telefone no formulário de cadastro/edição de gestante (já existia)
- [x] Criar botão "Enviar Lembrete de Vacina" na página de detalhes
- [x] Criar modal de seleção de template de mensagem
- [x] Implementar templates prontos de vacinas do pré-natal
- [x] Mostrar histórico de mensagens enviadas
- [x] Adicionar feedback visual de sucesso/erro no envio

### Testes
- [ ] Testar envio de mensagem via API
- [ ] Verificar histórico de mensagens
- [ ] Validar formatação de número de telefone
- [x] Testar interface de envio de lembretes
- [x] Testar histórico de mensagens
- [x] Validar aviso de telefone não cadastrado

## Bug: Erro na página CartaoPrenatal (11/12/2025)
- [x] Investigar erro "Cannot read properties of undefined (reading 'length')"
- [x] Adicionar validações para prevenir acesso a propriedades undefined
- [x] Testar correção na página /cartao-prenatal

## Remoção da funcionalidade WhatsApp (11/12/2025)
- [x] Remover componente EnviarLembreteWhatsApp.tsx
- [x] Remover componente HistoricoWhatsApp.tsx
- [x] Remover imports de WhatsApp do DetalhesGestante.tsx
- [x] Remover router whatsapp do routers.ts
- [x] Remover arquivo server/helena.ts
- [x] Remover arquivo server/helena.test.ts
- [x] Remover tabela mensagensWhatsapp do schema
- [x] Remover secret HELENA_API_TOKEN
- [x] Testar sistema após remoção

## Validação de Telefone (11/12/2025)
- [x] Instalar biblioteca react-imask (compatível com React 19)
- [x] Criar componente PhoneInput com máscara (00) 00000-0000
- [x] Adicionar validação regex no backend (formato brasileiro)
- [x] Atualizar FormularioGestante para usar PhoneInput
- [x] Testar máscara automática no navegador


## Validação de E-mail (11/12/2025)
- [x] Criar componente EmailInput com validação em tempo real
- [x] Adicionar feedback visual (ícone de check verde/X vermelho)
- [x] Implementar validação regex no backend
- [x] Atualizar FormularioGestante para usar EmailInput
- [x] Testar validação com e-mails válidos e inválidos


## Validação de Data de Nascimento (11/12/2025)
- [x] Criar componente DateOfBirthInput com cálculo automático de idade
- [x] Adicionar validação de idade mínima (10 anos) e máxima (60 anos)
- [ ] Mostrar idade calculada ao lado do campo - Pendente debug frontend
- [x] Implementar validação no backend (10-60 anos)
- [x] Atualizar FormularioGestante para usar DateOfBirthInput
- [x] Testar validação backend


## Correção de Legibilidade no PDF (11/12/2025)
- [x] Alterar cor do texto dos marcos importantes de branco para cor escura
- [x] Testar legibilidade no PDF gerado
- [x] Salvar checkpoint


## Busca Flexível sem Acentuação (13/12/2025)
- [x] Criar função de normalização de texto (remover acentos)
- [x] Atualizar endpoint de busca de gestantes no backend
- [x] Atualizar Dashboard para usar busca do backend
- [x] Testar busca com variações: Letícia/Leticia, Françoso/Francoso, Fabrícia/Fabricia
- [x] Salvar checkpoint


## Estender Busca Flexível para Outras Páginas (13/12/2025)
- [x] Identificar componentes que usam busca de gestantes (AutocompleteSelect)
- [x] Atualizar AutocompleteSelect para usar normalização de texto
- [x] Testar busca no Cartão Pré-natal (Leticia → Letícia)
- [x] Testar busca em Exames Laboratoriais (Francoso → Françoso)
- [x] Testar busca em Ultrassons (Leticia → Leticia Petrin)
- [x] Testar busca em Marcos Importantes (Francoso → Françoso)
- [x] Salvar checkpoint

## Bug DPP 1 Dia Antes na Tabela do Dashboard (13/12/2025)
- [x] Investigar código de formatação de DPP na tabela do Dashboard
- [x] Comparar com código dos Alertas que está funcionando corretamente
- [x] Corrigir formatação de data na tabela (problema de timezone)
- [x] Testar com dados da Camila Zanco
- [x] Salvar checkpoint

## Checkboxes para Conduta no Cartão Pré-natal (15/12/2025)
- [x] Analisar estrutura atual do formulário de consultas
- [x] Criar lista de opções de conduta predefinidas
- [x] Implementar checkboxes no formulário de nova consulta
- [x] Atualizar lógica de salvamento para filtrar apenas opções marcadas
- [x] Exibir apenas condutas selecionadas no registro salvo
- [x] Testar funcionalidade completa
- [x] Corrigir textos dos checkboxes (remover hífens e ajustar ortografia)
- [x] Salvar checkpoint

## Condutas no PDF e Condutas Personalizadas (15/12/2025)
- [x] Adicionar condutas ao componente PDF do Cartão Pré-natal
- [x] Criar tabela no banco para condutas personalizadas
- [x] Criar router para CRUD de condutas personalizadas
- [x] Implementar interface para adicionar condutas personalizadas
- [x] Combinar condutas predefinidas com personalizadas no formulário
- [x] Testar funcionalidades (parcial - condutas salvando corretamente)
- [x] Salvar checkpoint

## Finalizar Condutas no PDF (15/12/2025)
- [x] Verificar código atual de geração do PDF
- [x] Corrigir exibição das condutas no PDF
- [x] Testar geração do PDF com condutas
- [x] Salvar checkpoint

## Melhorar Formatação Visual das Condutas no PDF (15/12/2025)
- [x] Adicionar destaque visual (negrito/cor) para título "Conduta"
- [x] Adicionar caixa com fundo rosa claro e borda na cor da clínica
- [x] Separar condutas com bullets (•) para melhor leitura
- [x] Complementação em itálico e cor cinza para diferenciação
- [x] Testar visual do PDF
- [x] Salvar checkpoint

## Bug: Erro "data stack" ao fazer upload de foto de ultrassom (15/12/2025)
- [x] Investigar código de upload de imagens de ultrassom
- [x] Identificar causa do erro "data stack" (spread operator em arquivos grandes)
- [x] Corrigir o problema (usar FileReader.readAsDataURL)
- [ ] Testar upload de foto (pendente - usuário testará depois)
- [x] Salvar checkpoint

## Página de Logs de E-mails (15/12/2025)
- [x] Criar router para buscar logs de e-mails (já existia)
- [x] Criar página de Logs de E-mails com tabela
- [x] Adicionar filtros por status, data e gestante
- [x] Adicionar rota no App.tsx e menu
- [x] Testar funcionalidade
- [x] Apagar logs de teste do banco
- [x] Salvar checkpoint

## Envio Automático Diário de Lembretes (15/12/2025)
- [x] Criar endpoint /api/cron/processar-lembretes com autenticação
- [x] Configurar agendamento diário às 8h da manhã
- [x] Testar funcionamento
- [x] Salvar checkpoint

## Upload Múltiplo de Fotos de Exames Laboratoriais (15/12/2025)
- [x] Analisar estrutura atual da página de Exames Laboratoriais
- [x] Implementar seleção múltipla de fotos
- [x] Processar múltiplas imagens com IA
- [x] Exibir resultados na página (mesclagem automática)
- [ ] Testar funcionalidade (pendente - usuário testará depois)
- [x] Salvar checkpoint

## Upload Múltiplo de Fotos de Ultrassons (15/12/2025)
- [x] Analisar componente InterpretarUltrassomModal
- [x] Atualizar para suportar múltiplos arquivos
- [ ] Testar funcionalidade (pendente - usuário testará depois)
- [x] Salvar checkpoint

## Compressão Automática de Imagens (15/12/2025)
- [x] Criar função de compressão de imagens usando Canvas (imageCompression.ts)
- [x] Integrar compressão no InterpretarUltrassomModal
- [x] Aplicar também no InterpretarExamesModal
- [x] Exibir informações de compressão (tamanho original → comprimido)
- [ ] Testar funcionalidade (pendente - usuário testará depois)
- [x] Salvar checkpoint

## Drag-and-Drop para Upload de Arquivos (15/12/2025)
- [x] Adicionar drag-and-drop no InterpretarUltrassomModal
- [x] Adicionar drag-and-drop no InterpretarExamesModal
- [ ] Testar funcionalidade (pendente - usuário testará depois)
- [x] Salvar checkpoint

## Preview de Imagens e Histórico de Interpretações (15/12/2025)
- [ ] Criar tabela de histórico de interpretações no banco (historicoInterpretacoes)
- [ ] Implementar preview de imagens no InterpretarUltrassomModal
- [ ] Implementar preview de imagens no InterpretarExamesModal
- [ ] Implementar salvamento de histórico de interpretações no backend
- [ ] Criar interface de visualização do histórico de interpretações (Ultrassons)
- [ ] Criar interface de visualização do histórico de interpretações (Exames Lab)
- [ ] Testar funcionalidade
- [ ] Salvar checkpoint


## Preview de Imagens e Histórico de Interpretações (15/12/2025)

- [x] Preview de imagens antes de enviar (Ultrassons)
- [x] Preview de imagens antes de enviar (Exames Laboratoriais)
- [x] Histórico de interpretações de IA (tabela no banco)
- [x] Salvar interpretações no histórico (Ultrassons)
- [x] Salvar interpretações no histórico (Exames Laboratoriais)
- [x] Interface de visualização do histórico


## API REST para App Nativo da Gestante - LGPD (15/12/2025)

### Autenticação
- [x] Endpoint de solicitação de código (email/telefone)
- [x] Endpoint de validação de código
- [x] Geração de JWT para gestante
- [x] Tabela de códigos de acesso temporários

### Endpoints da API
- [x] GET /api/gestante/me - Dados da gestante logada
- [x] GET /api/gestante/marcos - Marcos importantes
- [x] GET /api/gestante/consultas - Consultas pré-natais
- [x] GET /api/gestante/exames - Exames laboratoriais
- [x] GET /api/gestante/ultrassons - Ultrassons
- [x] GET /api/gestante/peso - Dados para curva de peso

### Segurança e LGPD
- [x] Middleware de autenticação para gestantes
- [x] Isolamento de dados por gestanteId do token
- [x] Logs de acesso para auditoria

### Documentação
- [x] Documentação completa da API (API_DOCUMENTACAO.md)
- [x] Exemplos de requisições e respostas (React Native e Flutter)
- [x] Guia de integração para desenvolvedor mobile


## Assets e Branding para App Nativo (16/12/2025)
- [x] Copiar logos da marca para pasta de assets (app-assets/)
- [x] Documentar especificações do ícone do app (silhueta sem texto)
- [x] Documentar paleta de cores na API (vinho marsala + bege/pêssego)
- [x] Atualizar documentação com guia de branding (React Native e Flutter)

## Ícone do App - Extração da Silhueta (16/12/2025)
- [x] Extrair silhueta da gestante do logo vertical (icon-silhouette.png)
- [x] Gerar ícone 512x512px para Android (icon-android-512.png)
- [x] Gerar ícone 1024x1024px para iOS (icon-ios-1024.png)
- [x] Gerar versões alternativas com fundo vinho (icon-android-512-dark.png, icon-ios-1024-dark.png)
- [x] Salvar na pasta app-assets/

## Favicon do Site (16/12/2025)
- [x] Gerar favicon.ico a partir da silhueta
- [x] Gerar favicon em múltiplos tamanhos (16x16, 32x32, 48x48, 64x64, 128x128, 256x256)
- [x] Gerar apple-touch-icon (180x180)
- [x] Gerar android-chrome icons (192x192, 512x512)
- [x] Atualizar index.html com referências ao favicon
- [x] Adicionar theme-color (vinho marsala #722F37)

## Integração ChatGPT para Interpretação de Exames (16/12/2025)
- [x] Configurar API Key da OpenAI como secret
- [x] Criar módulo de integração com OpenAI (GPT-4o Vision)
- [x] Atualizar interpretação de ultrassons para usar OpenAI
- [x] Atualizar interpretação de exames laboratoriais para usar OpenAI
- [x] Melhorar extração de datas dos exames (prompt otimizado)
