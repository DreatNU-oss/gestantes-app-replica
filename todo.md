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

## Consultation Date Default Fix (19/01/2026)

- [x] Fix new consultation form to always use current date as default instead of draft/old value


## Justificativa para Alertas de Consulta Atrasada (19/01/2026)

- [x] Adicionar campo de justificativa no banco de dados (tabela gestantes ou nova tabela)
- [x] Criar endpoint para salvar/atualizar justificativa
- [x] Implementar UI para adicionar justificativa nos alertas de consulta atrasada
- [x] Adicionar opção pré-definida: "Parto próximo, com cardiotocografia/Doppler em dia"
- [x] Exibir justificativa no alerta quando preenchida


## Nova Justificativa - Consulta após Morfológico (19/01/2026)

- [x] Adicionar opção "Consulta será após o morfológico" na lista de justificativas
- [x] Configurar para solicitar data da consulta agendada (como "ja_agendada")


## Bug - Marcos Importantes não aparecem (19/01/2026)

- [x] Investigar por que os Marcos Importantes da Marcela Bellato Reis não aparecem
- [x] Corrigir a lógica de cálculo/exibição dos marcos (agora usa DUM quando US não disponível)
- [x] Corrigir bug onde igUltrassomDias com valor 0 não era salvo corretamente


## Bug - Justificativas não funcionam em produção (19/01/2026)

- [x] Investigar por que justificativas não estão sendo salvas em produção
- [x] Verificar se a tabela justificativasAlerta existe no banco de produção
- [x] Sincronizar schema com produção (adicionados novos valores ao enum motivo)


## Auto-fill Days Field (19/01/2026)

- [ ] Implementar preenchimento automático de 0 no campo de dias do ultrassom quando vazio


## Fix NaN in Birth Distribution Graph (19/01/2026)

- [ ] Corrigir valores NaN na coluna IG Atual do gráfico de distribuição de partos


## Remove Draft from New Patient Form (19/01/2026)

- [x] Remover funcionalidade de rascunho do formulário de nova gestante
- [x] Garantir que ao clicar em "Nova Gestante" todos os campos apareçam em branco


## Add Exit Confirmation Dialog (19/01/2026)

- [ ] Implementar aviso de confirmação ao sair do formulário com dados não salvos
- [ ] Detectar mudanças no formulário comparando com estado inicial
- [ ] Mostrar dialog de confirmação antes de cancelar/voltar


## Add Exit Confirmation Dialog (19/01/2026)

- [x] Implementar aviso de confirmação ao sair do formulário com dados não salvos
- [x] Detectar mudanças no formulário comparando com estado inicial
- [x] Mostrar dialog de confirmação antes de cancelar/voltar


## Set Default Values in New Patient Form (19/01/2026)

- [ ] Pré-selecionar "Nenhum" no campo Médico
- [ ] Pré-selecionar "A Definir" no campo Tipo de Parto


## Set Default Values in New Patient Form (19/01/2026)

- [x] Pré-selecionar "Nenhum" no campo Médico
- [x] Pré-selecionar "A Definir" no campo Tipo de Parto


## Add Data Planejada to Cartão de Pré-Natal (19/01/2026)

- [ ] Adicionar campo "Data Planejada para o Parto" no Cartão de Pré-Natal
- [ ] Permitir visualização e edição do campo


## Add Data Planejada to Cartão de Pré-Natal (19/01/2026)

- [x] Adicionar campo "Data Planejada para o Parto" no Cartão de Pré-Natal
- [x] Permitir visualização e edição do campo


## Make Data Planejada Editable in Cartão (19/01/2026)

- [ ] Tornar campo "Data Planejada para o Parto" editável no Cartão de Pré-Natal
- [ ] Adicionar input de data com salvamento automático


## Make Data Planejada Editable in Cartão (19/01/2026)

- [x] Tornar campo "Data Planejada para o Parto" editável no Cartão de Pré-Natal
- [x] Adicionar input de data com salvamento automático


## Move Data Planejada to Dedicated Section (19/01/2026)

- [ ] Remover campo editável de dentro dos "Dados da Gestante"
- [ ] Criar seção dedicada para "Data Planejada para o Parto" com auto-save
- [ ] Usar estilo similar às outras seções (Fatores de Risco, Medicamentos)


## Move Data Planejada to Dedicated Section (19/01/2026)

- [x] Remover campo editável de dentro dos "Dados da Gestante"
- [x] Criar seção dedicada para "Data Planejada para o Parto" com auto-save
- [x] Usar estilo similar às outras seções (Fatores de Risco, Medicamentos)


## Fix API Error on Cartão Prenatal (19/01/2026)

- [ ] Investigar erro "Unexpected token '<', is not valid JSON"
- [ ] Corrigir causa raiz do erro no backend
- [x] Fix API query error on /cartao-prenatal page

## Evolution Charts in Cartão de Pré-Natal
- [x] Create AU (Altura Uterina) evolution chart component
- [x] Create blood pressure evolution chart component
- [x] Integrate both charts into Cartão de Pré-Natal page

## Add Reference Curve to AU Chart
- [x] Add reference curve showing expected AU values by gestational week

## Fix IG Calculation in Consultations
- [ ] Ensure gestational age is calculated and saved in consultation form

- [x] Garantir cálculo e salvamento correto de IG nas consultas

## Backfill IG Fields
- [ ] Criar script para preencher campos de IG em consultas antigas
- [ ] Executar script e verificar gráficos
## Backfill IG Fields
- [x] Criar script para preencher campos de IG em consultas antigas
- [x] Executar script e verificar gráficos

## Highlight Abnormal Blood Pressure
- [x] Modificar gráfico de PA para destacar valores ≥140/90 em vermelho

## Add Normal Range Zone to AU Chart
- [x] Adicionar faixa sombreada de ±2cm no gráfico de AU

## Fix AU Chart Issues
- [x] Corrigir valores de AU exibidos 10x maior (mm ao invés de cm)
- [x] Alterar eixo X do gráfico de AU para iniciar em 12 semanas

## Remove DPP Filter from Gestantes Page
- [x] Remover filtro de "Período de DPP" da página Gestantes
- [x] Mover filtro Plano de Saúde para a mesma linha dos outros filtros

## Update AU Chart with Official Reference Ranges
- [x] Atualizar gráfico de AU com faixas de referência oficiais (percentis 10-90) do Ministério da Saúde

- [x] Corrigir área sombreada não visível no gráfico de AU (entre percentis 10-90)

## Melhorar Legibilidade dos Valores nos Gráficos
- [ ] Ajustar posicionamento dos valores no gráfico de AU (acima dos pontos)
- [ ] Ajustar posicionamento dos valores no gráfico de PA (acima dos pontos)

- [x] Adicionar ícones de aviso no histórico de consultas para AU fora dos percentis 10-90 ou PA ≥140/90

## Ajustar Eixo X do Gráfico de AU (20/01/2026)
- [x] Modificar gráfico de Altura Uterina para exibir eixo X fixo de 12 a 42 semanas
- [x] Garantir que curvas de referência (percentis 10-90) sejam sempre exibidas completas
- [x] Dados medidos da paciente devem aparecer sobrepostos às curvas de referência

## Criar Gráfico de PA com Curvas de Referência (20/01/2026)
- [x] Extrair dados de referência de PA do PDF fornecido
- [x] Criar arquivo com valores de referência (percentis) para PA sistólica e diastólica
- [x] Modificar gráfico de Pressão Arterial para eixo X fixo de 4 a 42 semanas
- [x] Adicionar curvas de referência completas ao gráfico
- [x] Dados medidos da paciente devem aparecer sobrepostos às curvas

## Reorganizar Filtros na Página Gestantes (20/01/2026)
- [x] Mover filtro de Plano de Saúde para a mesma linha dos outros filtros

## Ajustar Cor da Linha de Limite Diastólica no Gráfico de PA (20/01/2026)
- [x] Alterar cor da linha tracejada do limite de hipertensão diastólica (90 mmHg) de vermelho para azul

## BUG: Erro ao Cadastrar Gestante - medicoId NaN (20/01/2026)
- [x] Investigar formulário de cadastro de gestantes
- [x] Corrigir validação do campo medicoId que está enviando NaN
- [x] Testar cadastro de gestante após correção

## Seleção Automática de Gestante Após Cadastro (20/01/2026)
- [x] Modificar Dashboard para selecionar automaticamente a gestante recém-cadastrada após salvar (funcionalidade já existente)
- [x] Garantir que a gestante apareça selecionada no sidebar e pronta para iniciar consulta (funcionalidade já existente)

## Navegação Inteligente por TAB nos Exames Laboratoriais (20/01/2026)
- [x] Investigar estrutura atual do formulário de exames laboratoriais
- [x] Implementar navegação por TAB que pula automaticamente para o próximo campo de resultado dentro do mesmo trimestre
- [x] Garantir que TAB pule campos de data e vá direto para o próximo resultado
- [x] Testar navegação com diferentes cenários (primeiro, segundo e terceiro trimestres)


## BUG: IA não Interpreta Ultrassons Completamente (21/01/2026)
- [x] Investigar código de interpretação de ultrassom
- [x] Corrigir extração de Data do Exame (campo obrigatório)
- [x] Corrigir extração de DPP (Data Provável do Parto)
- [x] Corrigir extração de Ducto Venoso (DV) no morfológico 1º tri
- [x] Corrigir extração de IPs das Uterinas (Doppler)
- [x] Garantir que todos os campos do formulário sejam extraídos quando presentes no laudo


## Validação Visual de Campos Preenchidos pela IA (21/01/2026)
- [x] Implementar estado para rastrear quais campos foram preenchidos pela IA
- [x] Adicionar estilo visual de destaque amarelo nos campos preenchidos automaticamente
- [x] Permitir que o usuário revise e confirme os dados antes de salvar
- [x] Limpar destaque quando usuário editar manualmente o campo


## Criar Gestante de Teste Completa (21/01/2026)
- [x] Criar gestante TESTE TESTE com 36 anos, alto risco por idade
- [x] Configurar 36 semanas de gestação (DUM e USG)
- [x] Adicionar medicamentos: Polivitamínico e AAS
- [x] Criar 8 consultas mensais desde 7 semanas com PA normal e AU na curva
- [x] Registrar peso inicial 56kg, altura 165cm, ganho adequado
- [x] Cadastrar ultrassons: 1º US, Morfo 1º tri, Morfo 2º tri, USG Doppler
- [x] Preencher exames laboratoriais de todos os trimestres com valores normais


## Migrar Sistema de E-mails de Resend para Gmail SMTP (21/01/2026)
- [x] Atualizar arquivo de envio de e-mails para usar Gmail SMTP (nodemailer) em vez de Resend
- [x] Testar envio de lembretes automáticos via Gmail


## Limpeza e Otimização de Código (21/01/2026)
- [x] Analisar e remover dependências não utilizadas no package.json (6 pacotes removidos: resend, puppeteer, vaul, cmdk, embla-carousel-react, input-otp)
- [x] Remover código morto e imports não utilizados no servidor (3 arquivos removidos)
- [x] Remover código morto e imports não utilizados no cliente (32 componentes UI + 5 páginas/componentes removidos)
- [x] Limpar scripts temporários e arquivos obsoletos (5 scripts removidos)
- [x] Remover configurações do Resend (migrado para Gmail) - email-service.ts atualizado
- [x] Consolidar código duplicado


## Seleção Automática de Gestante ao Clicar no Menu (21/01/2026)
- [x] Implementar seleção automática ao clicar no nome da gestante no menu seletor
- [x] Gestante deve aparecer selecionada no sidebar após o clique


## Limpar Campo de Busca Automaticamente (21/01/2026)
- [x] Implementar limpeza automática do campo de busca após seleção de gestante
- [x] Campo deve ser resetado para vazio após onSelect ser acionado


## Autocomplete Inteligente em Observação e Conduta (21/01/2026)
- [x] Criar tabela no banco para armazenar histórico de textos de Observação e Conduta
- [x] Criar endpoint para buscar sugestões ordenadas por frequência de uso
- [x] Criar endpoint para registrar uso de texto (incrementar contador)
- [x] Implementar componente de autocomplete com sugestões do histórico
- [x] Integrar autocomplete nos campos de Observação e Conduta do formulário de consulta
- [x] Testar funcionalidade de sugestões e contagem de uso

## Atualizar Fatores de Risco (21/01/2026)
- [x] Adicionar novo fator de risco: "Cirurgia Uterina Prévia"
- [x] Atualizar texto do fator "Preditivo DHEG" para "Fator Preditivo Positivo para DHEG (Hist. Familiar, Doppler uterinas e/ou outros fatores de risco)"


## Código de Verificação Fixo Apple Review (21/01/2026)
- [x] Adicionar código de verificação fixo (123456) para email dreatnu@yahoo.com
- [x] Implementar no arquivo server/gestante-router.ts na função validarCodigo
- [x] Publicar alterações


## Endpoint para Gerar PDF do Cartão de Pré-Natal (21/01/2026)
- [x] Adicionar import de gerarPdfCartaoPrenatal no gestante-router.ts
- [x] Adicionar endpoint gerarPdfCartao após endpoint ultrassons
- [ ] Testar geração de PDF via API
- [x] Publicar alterações


## Incluir Exames, Marcos e Ultrassons no PDF (21/01/2026)
- [x] Implementar agrupamento de exames laboratoriais por trimestre para o PDF
- [x] Adicionar marcos importantes ao PDF do cartão de pré-natal
- [x] Adicionar ultrassons ao PDF do cartão de pré-natal
- [x] Atualizar botão "Visualizar para Impressão" com dados completos
- [x] Atualizar botão "Baixar PDF Profissional" com dados completos
- [x] Atualizar endpoint da API mobile com dados completos
- [x] Testar geração de PDF com todos os dados


## BUG: Erro ao Gerar PDF - Retorna HTML em vez de JSON (22/01/2026)
- [x] Investigar causa do erro "Unexpected token '<'" na geração de PDF
- [x] Verificar logs do servidor para identificar erro
- [x] Corrigir função de geração de PDF (erro era temporário, PDF funciona corretamente)
- [x] Testar geração de PDF após correção


## Adicionar Exames Laboratoriais para TESTE TESTE (22/01/2026)
- [x] Identificar ID da gestante TESTE TESTE no banco de dados
- [x] Inserir exames laboratoriais do 1º trimestre (valores normais)
- [x] Inserir exames laboratoriais do 2º trimestre (valores normais)
- [x] Inserir exames laboratoriais do 3º trimestre (valores normais)
- [x] Gerar PDF e validar exibição dos exames

## Adicionar Gráficos e Seções Faltando no HTML de Impressão (22/01/2026)
- [x] Adicionar gráfico de AU (Altura Uterina) na página de impressão HTML
- [x] Adicionar gráfico de PA (Pressão Arterial) na página de impressão HTML
- [x] Adicionar seção de Exames Laboratoriais na página de impressão HTML
- [x] Adicionar seção de Ultrassons na página de impressão HTML


## Adicionar Gráficos de Evolução no PDF (22/01/2026)
- [x] Analisar estrutura atual do PDF e identificar como adicionar gráficos
- [x] Implementar geração de gráfico de Peso como imagem no servidor
- [x] Implementar geração de gráfico de AU como imagem no servidor
- [x] Implementar geração de gráfico de PA como imagem no servidor
- [x] Integrar gráficos no PDF usando PDFKit
- [x] Testar geração do PDF com gráficos para TESTE TESTE

## Correção de Texto no PDF (22/01/2026)
- [x] Corrigir texto do fator de risco "Idade >= 35 anos" no PDF

## Fonte Unicode no PDF (22/01/2026)
- [x] Baixar e configurar fonte Noto Sans com suporte Unicode
- [x] Atualizar código do PDF para usar a fonte Unicode
- [x] Restaurar caracteres especiais (≥, ≤, °, ü) nos textos
- [x] Testar geração do PDF com caracteres especiais

## Fonte Bold nos Títulos do PDF (22/01/2026)
- [x] Identificar todos os títulos e cabeçalhos no código do PDF
- [x] Aplicar NotoSans-Bold nos títulos e cabeçalhos
- [x] Testar geração do PDF com fontes bold

## Ajuste de Espaçamento no PDF (22/01/2026)
- [x] Analisar espaçamentos atuais no código do PDF
- [x] Otimizar espaçamentos entre seções e elementos
- [x] Testar geração do PDF com novos espaçamentos
- [x] Substituir fonte NotoSans por DejaVu Sans (suporte completo a Unicode, inclui ≥)

## Marca d'Água no PDF (22/01/2026)
- [x] Implementar marca d'água com logo da clínica em todas as páginas do PDF
- [x] Ajustar opacidade para ser discreta mas visível
- [x] Testar geração do PDF com marca d'água

## Cabeçalhos em Negrito nas Tabelas do PDF (22/01/2026)
- [x] Aplicar fonte bold nos cabeçalhos da tabela de consultas
- [x] Aplicar fonte bold nos cabeçalhos da tabela de exames laboratoriais
- [x] Aplicar fonte bold nos cabeçalhos da tabela de ultrassons
- [x] Testar geração do PDF com cabeçalhos em negrito

## Otimização de Largura das Colunas nas Tabelas do PDF (22/01/2026)
- [x] Ajustar largura das colunas na tabela de Histórico de Consultas
- [x] Ajustar largura das colunas na tabela de Ultrassons
- [x] Ajustar largura das colunas na tabela de Exames Laboratoriais
- [x] Testar geração do PDF com novas larguras

## Quebra de Linha Automática no PDF (22/01/2026)
- [x] Implementar quebra de linha automática na coluna Conduta
- [x] Implementar quebra de linha automática na coluna Observações
- [x] Ajustar altura das linhas dinamicamente baseado no conteúdo
- [x] Testar geração do PDF com textos longos

## Numeração de Páginas no PDF (22/01/2026)
- [x] Implementar numeração de páginas no formato "Página X de Y"
- [x] Posicionar numeração no rodapé centralizado de cada página
- [x] Testar geração do PDF com numeração de páginas (já estava implementado)

## Cabeçalho com Nome da Paciente no PDF (22/01/2026)
- [x] Adicionar nome completo da paciente no cabeçalho das páginas 2+
- [x] Manter primeira página sem cabeçalho adicional (já tem logo e título)
- [x] Testar geração do PDF com cabeçalho

## Correções de Bugs (23/01/2026)
- [ ] Medicamentos em uso não aparecem no HTML de impressão
- [ ] Título "Cartão de Pré-natal" sobrepondo o logo no PDF
- [x] Pontos não visíveis no gráfico de AU no PDF (corrigido: conversão de mm para cm)


## Correções HTML e PDF - Ultrassons e Marcos (23/01/2026)
- [x] Ultrassons no HTML de impressão aparecem incompletos - exibir todos os dados registrados
- [x] Marcos Importantes não aparecem no HTML de impressão - adicionar seção com datas calculadas
- [x] Marcos Importantes no PDF mostram apenas IG sem datas - já estava mostrando datas (verificado)


## Atualizar Política de Privacidade Bilíngue (23/01/2026)
- [x] Substituir conteúdo da página /politicadeprivacidade pelo HTML bilíngue
- [x] Validar seletor de idioma (Português/English)
- [x] Testar alternância entre idiomas


## Modal de Informações ao Selecionar Gestante (24/01/2026)
- [x] Criar componente de modal para exibir informações da gestante
- [x] Exibir Fatores de Risco no modal
- [x] Exibir Medicamentos em Uso no modal
- [x] Exibir Observações do cadastro (se houver) no modal
- [x] Integrar modal ao fluxo de seleção de gestante (Dashboard e Sidebar)
- [x] Testar funcionalidade com diferentes gestantes


## Modal de Informações ao Abrir Consulta (27/01/2026)
- [x] Exibir modal automaticamente ao abrir página de consulta
- [x] Mostrar Fatores de Risco, Medicamentos em Uso e Observações da gestante
- [x] Testar funcionalidade


## Incluir Alergias no Modal (27/01/2026)
- [x] Adicionar seção de alergias no modal de informações da gestante
- [x] Exibir alergias logo abaixo dos medicamentos em uso (em vermelho)
- [x] Testar funcionalidade


## Ajustar Momento de Exibição do Modal (27/01/2026)
- [x] Remover modal da seleção de gestante (Dashboard e Sidebar)
- [x] Manter modal apenas ao abrir nova consulta (botão Consulta no menu e + Nova Consulta no Cartão)
- [x] Testar funcionalidade


## Gerenciamento de Fatores de Risco e Medicamentos em Configurações (27/01/2026)
- [x] Criar tabelas no banco de dados para opções personalizadas de fatores de risco
- [x] Criar tabelas no banco de dados para opções personalizadas de medicamentos
- [x] Criar rotas de API para CRUD de opções de fatores de risco
- [x] Criar rotas de API para CRUD de opções de medicamentos
- [x] Criar página de configuração de Fatores de Risco no menu Configurações
- [x] Criar página de configuração de Medicamentos no menu Configurações
- [x] Adicionar suporte a texto livre em alguns itens (como alergia medicamentosa)
- [x] Implementar ordenação alfabética automática em todos os menus e seletores
- [x] Atualizar seletores no cadastro de gestantes para usar opções do banco
- [x] Atualizar seletores no Cartão de Pré-natal para usar opções do banco
- [x] Testar funcionalidade completa
- [x] Adicionar Tipo de Parto Desejado e Data do Parto ao modal de informações da gestante
- [x] Corrigir página de configuração de Medicamentos que não está funcionando
- [x] Corrigir erro de validação no campo 'tipo' dos fatores de risco na página do cartão pré-natal
- [x] Corrigir inserção automática do fator de risco 'Idade Avançada' ao preencher data de nascimento
- [x] Implementar remoção automática do fator de risco 'Idade Avançada' quando idade < 35 anos
- [x] Implementar detecção automática de obesidade (IMC >= 30) como fator de risco

## Melhorar Análise de Exames por IA (28/01/2026)
- [ ] Investigar código atual de interpretação de exames laboratoriais por IA
- [ ] Melhorar prompt para extrair TODOS os 25+ exames corretamente
- [ ] Corrigir extração de urocultura (positiva/negativa com bactéria identificada)
- [ ] Garantir extração correta de todos os exames sorológicos
- [ ] Testar com PDF fornecido e validar resultados
