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
- [x] IA não sobrescrever campos já preenchidos (adicionar apenas em campos vazios)
- [x] Botão de exclusão por trimestre com confirmação

## Registro Automático de Polivitamínico (28/01/2026)
- [x] Registrar uso de Polivitamínico automaticamente ao cadastrar nova gestante
- [x] Atualizar gestantes existentes no banco de dados com Polivitamínico (verificado: todas as 128 gestantes já possuem)


## Alterar BCF na Consulta de Pré-natal (28/01/2026)
- [x] Mudar opções do campo BCF de "Sim/Não" para "Positivo/Não audível"


## Nome Planejado do Bebê no Cartão de Pré-Natal (28/01/2026)
- [x] Adicionar campo nomeBebe no schema da tabela gestantes
- [x] Criar endpoint para atualizar nome do bebê
- [x] Adicionar campo no formulário de cadastro/edição de gestante
- [x] Exibir nome do bebê no Cartão de Pré-Natal


## Sexo do Bebê no Cartão de Pré-Natal (28/01/2026)
- [x] Adicionar campo sexoBebe no schema da tabela gestantes
- [x] Atualizar endpoints de criação e atualização de gestantes
- [x] Adicionar campo no formulário de cadastro/edição de gestante
- [x] Exibir sexo do bebê no Cartão de Pré-Natal
- [x] Incluir sexo do bebê no PDF gerado


## Ícones e Cores para Sexo do Bebê (28/01/2026)
- [x] Adicionar ícones diferenciados por sexo (masculino/feminino) na seção Dados do Bebê
- [x] Usar cores azul para masculino e rosa para feminino
- [x] Exibir ícone/cor nos alertas de partos próximos
- [x] Aplicar estilo visual no formulário de cadastro


## Bug: Upload de Exames não Registrando Resultados (28/01/2026)
- [ ] Investigar por que o upload de PDF de exames não está registrando resultados
- [ ] Testar com arquivo Laudo.104534620.pdf da gestante Meireceli
- [ ] Corrigir o problema identificado


## Correção de Layout do Modal InterpretarExames (28/01/2026)
- [x] Corrigir layout do modal InterpretarExamesModal - botão não visível em telas menores
- [x] Garantir que o DialogFooter com os botões seja sempre visível
- [x] Reduzir altura máxima do modal para 80vh
- [x] Adicionar scroll interno ao conteúdo do modal
- [x] Reduzir espaçamentos internos para melhor aproveitamento do espaço

## Correção do Cálculo de Trimestre Automático (28/01/2026)
- [x] Identificar problema: trimestre calculado incorretamente quando DUM não está disponível
- [x] Implementar fallback usando DPP pelo Ultrassom quando DUM não está disponível
- [x] Modificar InterpretarExamesModal para aceitar dppUltrassom como prop
- [x] Calcular DUM estimada a partir da DPP (DUM = DPP - 280 dias)
- [x] Atualizar ExamesLaboratoriais para passar dppUltrassom ao modal
- [x] Atualizar cálculo de trimestre no onResultados para usar DUM ou DPP

## Mensagens de Erro Detalhadas na Interpretação de Exames (28/01/2026)
- [x] Analisar fluxo atual de interpretação e identificar onde adicionar feedback
- [x] Implementar relatório de exames encontrados vs não encontrados no backend
- [x] Criar interface para exibir feedback detalhado ao usuário
- [x] Mostrar lista de exames extraídos com sucesso
- [x] Mostrar lista de exames esperados que não foram encontrados
- [x] Testar com diferentes PDFs
- [x] Modal permanece aberto após processamento para usuário ver relatório
- [x] Botão "Ver detalhes da extração" para expandir/colapsar lista
- [x] Barra de progresso mostrando taxa de sucesso (%)

## Bug: Checkbox de Confirmação não Clicável (29/01/2026)
- [x] Checkbox "Confirmo que desejo continuar mesmo assim" não responde ao clique
- [x] Resolvido removendo o checkbox e simplificando o alerta para apenas informativo

## Simplificação do Alerta de Coerência de Trimestre (29/01/2026)
- [x] Remover checkbox de confirmação do alerta de coerência
- [x] Manter apenas o aviso informativo
- [x] Permitir upload de arquivo sem necessidade de confirmar

## BUG: Exames Extraídos pela IA não Inseridos nos Campos (30/01/2026)
- [x] Investigar por que os exames extraídos pela IA não aparecem nos campos da tabela
- [x] Mensagem de êxito aparece (24 exames) mas campos ficam vazios
- [x] Verificar fluxo de dados entre InterpretarExamesModal e ExamesLaboratoriais
- [x] Corrigir inserção dos exames no estado da página
- [x] Problema: Frontend só processava chaves com :: no modo automático, mas backend sempre retorna nesse formato
- [x] Solução: Modificado para sempre processar chaves com :: independentemente do modo

## Adicionar Data no Modal de Exames Qualitativos em Lote (30/01/2026)
- [x] Adicionar campo de data no topo do modal "Preencher Exames Qualitativos em Lote"
- [x] Permitir definir data específica para todos os exames do lote
- [x] Aplicar a data selecionada a todos os exames preenchidos no lote
- [x] Data inicializada com a data atual ao abrir o modal
- [x] Mensagem de sucesso mostra a data aplicada

## Correção de Cor do Coombs Indireto (30/01/2026)
- [x] Coombs indireto "Não Reagente" deve aparecer em verde (resultado normal)
- [x] Adicionado Coombs indireto à lista EXAMES_SOROLOGICOS para usar dropdown com cores corretas
- [x] Não Reagente = verde (normal), Reagente = vermelho (crítico)

## Investigar Amanda Cristina Souza Oliveira não aparece em Alertas de Partos Próximos (02/02/2026)
- [x] Verificar dados da gestante Amanda Cristina Souza Oliveira no banco de dados
- [x] Analisar lógica de filtro dos alertas de partos próximos
- [x] Identificar por que ela não está sendo incluída na lista
- [x] Corrigir o problema
- [x] Problema: Data programada estava como 05/02/2025 (ano errado)
- [x] Solução: Corrigida para 05/02/2026 no banco de dados
- [x] Amanda agora aparece nos alertas (3 dias para o parto)

## Alterações nos Campos de Parto (02/02/2026)
- [x] Renomear "Data Planejada para o Parto" para "Data Planejada para a Cesárea"
- [x] Adicionar automação: ao cadastrar data de cesárea, mudar automaticamente "Tipo de Parto Desejado" para "Cesárea"
- [x] Renomear "Tipo de Parto Desejado" para "Tipo de Parto Desejado/Indicado"
- [x] Atualizar todos os componentes que exibem esses campos
- [x] Testar a automação
- [x] Arquivos modificados: FormularioGestante.tsx, CartaoPrenatal.tsx, GraficoTiposPartosDesejados.tsx, ModalInfoGestante.tsx, CartaoPrenatalImpressao.tsx

## Adicionar Campo de Motivo da Indicação da Cesárea (02/02/2026)
- [x] Adicionar coluna 'motivoCesarea' na tabela gestantes do banco de dados
- [x] Atualizar schema no drizzle/schema.ts
- [x] Executar migração do banco de dados (pnpm db:push) - migração 0041_melted_chronomancer.sql
- [x] Adicionar campo no FormularioGestante.tsx
- [x] Atualizar componentes que exibem dados: CartaoPrenatal.tsx
- [x] Atualizar schemas de create e update em routers.ts
- [x] Testar cadastro e edição com o novo campo
- [x] Campo aparece condicionalmente apenas quando há data de cesárea programada
- [x] Testado com sucesso na gestante Cinthia (motivo: "Cesárea iterativa")

## Criar Lista de Seleção para Motivos de Cesárea (02/02/2026)
- [x] Definir lista de motivos mais comuns para indicação de cesárea
- [x] Substituir campo de texto livre por Select com opções pré-definidas
- [x] Adicionar opção "Outro motivo" na lista
- [x] Implementar no FormularioGestante.tsx
- [x] Implementar no CartaoPrenatal.tsx
- [x] Testar seleção e salvamento
- [x] 13 opções disponíveis: Cesárea iterativa, Apresentação pélvica, Gestação gemelar, Placenta prévia, Sofrimento fetal, Macrossomia fetal, Descolamento prematuro de placenta, Herpes genital ativo, HIV positivo, Cirurgia uterina prévia, Falha na indução do parto, Desproporção cefalopélvica, Outro motivo

## Adicionar Campo de Texto para "Outro Motivo" de Cesárea (02/02/2026)
- [x] Adicionar coluna 'motivoCesareaOutro' na tabela gestantes do banco de dados
- [x] Atualizar schema no drizzle/schema.ts
- [x] Executar migração do banco de dados (pnpm db:push)
- [x] Implementar campo condicional no FormularioGestante.tsx que aparece quando "Outro motivo" é selecionado
- [x] Implementar campo condicional no CartaoPrenatal.tsx
- [x] Atualizar schemas de create e update em routers.ts
- [x] Testar seleção de "Outro motivo" e preenchimento do campo de texto
- [x] Campo aparece automaticamente ao selecionar "Outro motivo"
- [x] Label: "Especifique o motivo"
- [x] Placeholder: "Descreva a indicação médica"
- [x] Testado com sucesso na gestante Cinthia

## Corrigir Salvamento Automático de Nome e Sexo do Bebê (02/02/2026)
- [x] Investigar onde está o salvamento automático dos campos nomeBebe e sexoBebe
- [x] Remover salvamento automático que exibe mensagem incorreta "Data Planejada atualizada"
- [x] Adicionar botão "Salvar" no canto inferior direito da seção "Dados do Bebê"
- [x] Testar edição dos campos sem salvamento automático
- [x] Testar salvamento manual com o novo botão
- [x] Problema: Campos tinham onChange que chamava updateGestanteMutation diretamente
- [x] Solução: Criado estado local dadosBebe, removido onChange automático, adicionado botão Salvar
- [x] Testado com sucesso: digitei "Maria Clara" e selecionei "Feminino" sem mensagens incorretas
- [x] Botão Salvar funciona corretamente e mostra mensagem "Dados do bebê atualizados com sucesso!"
- [x] Card "Dados do Bebê" agora mostra "♀ Menina" no título após salvar

## Criar Gráfico de Pizza de Motivos de Cesárea (02/02/2026)
- [x] Analisar estrutura da página de Estatísticas
- [x] Criar componente GraficoMotivosCesarea.tsx baseado em GraficoTiposPartosDesejados.tsx
- [x] Buscar dados de gestantes com cesárea programada e seus motivos
- [x] Agrupar dados por motivo e contar ocorrências
- [x] Implementar gráfico de pizza com Chart.js
- [x] Adicionar valores nas fatias do gráfico (porcentagens)
- [x] Integrar gráfico na página de Estatísticas
- [x] Testar com dados reais
- [x] Gráfico de pizza criado com 13 cores variadas para os diferentes motivos
- [x] Exibe mensagem "Nenhuma cesárea programada com motivo registrado" quando não há dados
- [x] Testado com sucesso: Cinthia com "Cesárea iterativa" (100% em vermelho)
- [x] Legenda clara mostrando o motivo e a cor correspondente
- [x] Descrição dinâmica: "Distribuição dos motivos de cesárea programada entre X gestante(s)"

## Exibir Motivo da Cesárea no Modal de Informações (02/02/2026)
- [ ] Localizar o componente ModalInfoGestante.tsx
- [ ] Adicionar exibição de motivoCesarea quando presente
- [ ] Adicionar exibição de motivoCesareaOutro quando motivoCesarea for "Outro motivo"
- [ ] Testar visualização no modal

## Exibir Motivo da Cesárea no Modal de Informações Rápidas (02/02/2026)
- [x] Localizar o componente ModalInfoGestante.tsx
- [x] Adicionar exibição do campo motivoCesarea no modal
- [x] Adicionar exibição do campo motivoCesareaOutro quando aplicável
- [x] Testar visualização com gestante que tem cesárea programada
- [x] Campo aparece na seção "Informações do Parto" do modal
- [x] Exibe "Motivo da Indicação da Cesárea: [motivo]"
- [x] Quando motivo é "Outro motivo", exibe também o campo motivoCesareaOutro
- [x] Testado com sucesso: Cinthia mostrando "Cesárea iterativa"

## Alerta de Data de Cesárea Fora do Período Recomendado (02/02/2026)
- [x] Implementar validação de data de cesárea no FormularioGestante.tsx
- [x] Implementar validação de data de cesárea no CartaoPrenatal.tsx
- [x] Calcular IG na data programada da cesárea baseado na DUM ou ultrassom
- [x] Exibir alerta visual laranja quando data for antes de 37 semanas (pré-termo)
- [x] Exibir alerta visual vermelho quando data for após 41 semanas (pós-termo)
- [x] Testar com diferentes cenários (antes de 37s, entre 37-41s, após 41s)
- [x] useEffect monitora formData.dataPartoProgramado, formData.dum, formData.dataUltrassom para validação em tempo real
- [x] Testado com 20/01/2026 (35s6d) - Alerta laranja exibido corretamente
- [x] Testado com 25/03/2026 (45s0d) - Alerta vermelho exibido corretamente
- [x] Testado com 11/02/2026 (38s4d) - Sem alerta (dentro do período recomendado)
- [x] Mensagens claras e informativas com IG estimada e recomendações médicas

## Melhorias em Exames Laboratoriais (02/02/2026)
- [x] Remover linha "Copiar Data para Múltiplos exames" em Exames Laboratoriais
- [x] Simplificar modo manual da IA: apenas escolha de trimestre (data extraída automaticamente pela IA)
- [ ] Resolver problema de múltiplos exames do mesmo tipo no mesmo trimestre (permitir 2+ hemogramas no 3º trimestre sem apagar dados)

## Detecção de PDF Protegido por Senha (02/02/2026)
- [x] Implementar verificação de PDF protegido por senha no backend (pdfUtils.ts)
- [x] Criar endpoint verificarPdfProtegido no router examesLab
- [x] Criar endpoint desbloquearPdf no router examesLab
- [x] Implementar UI para solicitar senha quando PDF protegido
- [x] Implementar desbloqueio de PDF com senha fornecida
- [x] Criar testes unitários para pdfUtils

## Melhorias em Exames Laboratoriais - Sistema de Múltiplas Datas (02/02/2026)
- [x] Implementar sistema de múltiplas datas por exame (histórico)
- [x] Criar endpoint buscarComHistorico no backend
- [x] Criar endpoint excluirResultado no backend
- [x] Criar componente HistoricoExamePopover
- [x] Implementar indicador visual de PDF desbloqueado na lista de arquivos
- [x] Implementar cache de PDFs desbloqueados (sessionStorage)

## Salvamento de Arquivos de Exames (02/02/2026)
- [ ] Criar tabela no banco de dados para armazenar arquivos de exames
- [ ] Implementar endpoints de upload e listagem de arquivos
- [ ] Modificar modal de interpretação para salvar arquivo após processar
- [ ] Criar seção de arquivos na página de Exames Laboratoriais

## Salvamento de Arquivos de Exames (02/02/2026)
- [x] Criar tabela arquivosExames no banco de dados
- [x] Implementar endpoints de upload, listagem e exclusão de arquivos
- [x] Modificar modal de interpretação para salvar arquivo após processar
- [x] Criar seção "Arquivos de Exames" na página de Exames Laboratoriais
- [x] Salvar senha de PDFs protegidos para abertura automática futura

## Melhorias em Arquivos de Exames (02/02/2026)
- [x] Implementar desbloqueio automático de PDFs protegidos usando senha salva
- [x] Adicionar filtro por trimestre na lista de arquivos

## Sistema de Múltiplas Datas por Exame (02/02/2026)
- [ ] Criar endpoint para buscar histórico de exames por tipo/trimestre
- [ ] Modificar lógica de salvamento para preservar dados existentes
- [ ] Criar componente HistoricoExamePopover
- [ ] Integrar histórico na tabela de exames

## Sistema de Múltiplas Datas por Exame - CONCLUÍDO (03/02/2026)
- [x] Criar endpoint buscarComHistorico para buscar exames com histórico
- [x] Modificar endpoint salvar para usar modoAdicionar e preservar dados existentes
- [x] Integrar HistoricoExamePopover na tabela de exames
- [x] Adicionar mutation excluirResultado para remover itens do histórico
- [x] Permitir selecionar valor do histórico como ativo

## Gráfico Tipo de Parto - Melhorias (03/02/2026)
- [x] Mudar gráfico de pizza para gráfico de barras
- [x] Adicionar interatividade para ver nomes das pacientes em cada barra
- [x] Manter valores numéricos visíveis nas barras

## Interatividade em Gráficos Adicionais (03/02/2026)
- [x] Adicionar clique para ver pacientes no gráfico Partos por Médico
- [x] Adicionar clique para ver pacientes no gráfico Partos por Convênio

## Alertas de Consultas Pré-natal - Limites Dinâmicos (03/02/2026)
- [ ] Modificar limites de alerta: até 34 sem (35 dias), 34-36 sem (18 dias), após 36 sem (10 dias)

## Layout de Exames Laboratoriais (03/02/2026)
- [x] Mover seção de histórico de interpretações para parte inferior da página


## Sistema de Autenticação Customizado (03/02/2026)

- [x] Criar página de Login com email/senha
- [x] Usar logo vertical da Clínica Mais Mulher
- [x] Manter cores da marca (bordô #722F37 e rosa)
- [x] Criar página de Esqueci Senha
- [x] Criar página de Redefinir Senha
- [x] Criar página de gerenciamento de Emails Autorizados
- [x] Adicionar link para Emails Autorizados no menu Configurações
- [x] Atualizar rotas no App.tsx
- [x] Atualizar Home.tsx para redirecionar para /login
- [x] Backend: endpoints de login com senha
- [x] Backend: endpoints de recuperação de senha
- [x] Backend: endpoints de gerenciamento de emails autorizados
- [x] Migrar emails dos usuários existentes para tabela emailsAutorizados


## Reorganização da Página de Exames Laboratoriais (03/02/2026)

- [x] Mover histórico de interpretações para a parte inferior da página


## Sistema de Login Simplificado - Primeiro Acesso (03/02/2026)

- [x] Criar endpoint para verificar se email é autorizado e se já tem senha
- [x] Criar endpoint para definir senha no primeiro acesso (sem email)
- [x] Modificar página de Login para detectar primeiro acesso
- [x] Permitir criação de senha diretamente na tela de login
- [x] Remover necessidade de envio de emails para primeiro acesso


## Alterar Senha para Usuários Logados (03/02/2026)

- [x] Criar endpoint de backend para alterar senha (verificar senha atual)
- [x] Criar página/componente de alteração de senha
- [x] Adicionar link no menu de configurações
- [x] Testar funcionalidade completa


## Segurança Avançada de Autenticação (03/02/2026)

- [x] Adicionar colunas no banco para tentativas de login e bloqueio
- [x] Implementar bloqueio após 5 tentativas de senha incorreta
- [x] Adicionar coluna passwordChangedAt para invalidar sessões
- [x] Invalidar todas as sessões ao alterar senha
- [x] Atualizar frontend para mostrar mensagens de bloqueio


## Desbloquear Contas Bloqueadas (03/02/2026)

- [x] Atualizar backend para listar status de bloqueio dos usuários
- [x] Adicionar botão de desbloquear na página de Emails Autorizados
- [x] Mostrar indicador visual de contas bloqueadas


## Modal de Iniciar Consulta (03/02/2026)

- [x] Adicionar Idade Gestacional no modal de iniciar consulta
- [x] Adicionar História Obstétrica no modal de iniciar consulta

- [x] Corrigir exibição de dados no modal de iniciar consulta (dados não aparecem)

- [x] Atualizar endpoint create para retornar todos os dados necessários para o modal (IG, DPP, História Obstétrica)


## Modal de Informações da Gestante - IG e História Obstétrica (03/02/2026)

- [x] Adicionar Idade Gestacional (IG pela DUM e pelo US) no modal que aparece ao iniciar consulta
- [x] Adicionar História Obstétrica (G, P, PN, PC, A) no modal que aparece ao iniciar consulta


## Melhoria na Seleção de Gestante (03/02/2026)

- [x] Exibir card da gestante selecionada logo abaixo da caixa de pesquisa
- [x] Incluir ícones de ação (Cartão, Consulta, Exames, Ultrassons) no card
- [x] Facilitar acesso rápido às funcionalidades da gestante selecionada


## Busca Rápida por Teclado (03/02/2026)

- [x] Adicionar navegação por setas (cima/baixo) entre resultados da busca
- [x] Selecionar gestante com Enter
- [x] Destacar visualmente o item focado durante navegação


## Melhorias nos Gráficos de Estatísticas (03/02/2026)

- [x] Adicionar legenda com percentual em cada fatia do gráfico de pizza de indicação de cesáreana
- [x] Adicionar funcionalidade de clicar para ver lista de gestantes no gráfico de distribuição por convênio
- [x] Adicionar funcionalidade de clicar para ver lista de gestantes no gráfico de motivos de indicação de cesárea
- [x] Adicionar funcionalidade de clicar para ver lista de gestantes no gráfico de tipos de parto indicado


## Ícone de Edição no Card de Gestante Selecionada (04/02/2026)

- [x] Adicionar ícone de edição no card de gestante selecionada no Dashboard
- [x] Ao clicar no ícone, abrir o formulário de edição da gestante


## Detecção de Exames Laboratoriais Duplicados (04/02/2026)

- [x] Identificar onde os exames são processados e adicionados no backend
- [x] Implementar lógica de comparação de exames (mesma data e resultados idênticos)
- [x] Criar endpoint para verificar duplicatas antes de adicionar
- [x] Atualizar frontend para mostrar alerta quando detectar duplicata
- [x] Sistema automaticamente não adiciona duplicatas e alerta o usuário


## Comparação Inteligente de Exames (04/02/2026)

- [x] Implementar lógica para detectar quando novo exame é versão completa de um parcial
- [x] Sistema automaticamente adiciona versão completa quando detecta parcial
- [x] Sistema mostra alerta informativo sobre atualizações automáticas
- [x] Mostrar diferenças entre versão parcial e completa no alerta
- [x] Testar fluxo completo de substituição


## Correção do Formato de Pressão Arterial (04/02/2026)

- [x] Localizar formulário de cadastro de consultas onde pressão arterial é inserida
- [x] Adicionar campos pressaoSistolica e pressaoDiastolica (INTEGER) no schema do banco
- [x] Executar migração do banco de dados
- [x] Criar script para migrar dados existentes de pressaoArterial para os novos campos (310 consultas migradas com sucesso)
- [x] Atualizar backend (routers.ts) para processar ambos os formatos e salvar nos campos separados
- [x] Atualizar frontend para aceitar "x" e "/" como separadores
- [x] Atualizar exibição para mostrar no formato "sistolica/diastolica"
- [x] Testar formatos "120x80" e "120/80" (servidor reiniciado e funcionando)

## Marcos Gestacionais - Fallback para DUM (04/02/2026)

- [x] Analisar código atual dos marcos gestacionais no Cartão de Pré-natal
- [x] Implementar lógica de preferência: usar ultrassom primeiro, DUM como fallback
- [x] Atualizar cálculo de IG para marcos quando não houver ultrassom (função calcularDataPorUS já tinha fallback)
- [x] Testar com gestante TESTE TESTE (sem ultrassom, apenas DUM)
- [x] Verificar exibição dos marcos no Cartão de Pré-natal (descrição dinâmica implementada)

## Melhorar texto explicativo DUM incompatível no Dashboard (04/02/2026)

- [x] Alterar texto "DUM Incompatível" para "Não considerada (incompatível com US)" no Dashboard

## Campo Queixas e Texto para PEP (04/02/2026)

- [x] Adicionar campo "queixas" no schema do banco de dados (consultasPrenatal)
- [x] Atualizar routers/procedures para incluir campo queixas
- [x] Adicionar campo Queixas no formulário de nova consulta
- [x] Implementar função para gerar texto formatado no padrão PEP
- [x] Criar modal após salvar consulta com texto formatado e botão "Copiar para PEP"
- [x] Testar funcionalidade com gestante TESTE TESTE

## Campos Adicionais no Texto PEP (04/02/2026)

- [x] Adicionar campo edema no estado do formulário
- [x] Adicionar BCF no texto gerado para PEP
- [x] Adicionar Apresentação Fetal no texto gerado para PEP
- [x] Adicionar Edema no texto gerado para PEP
- [x] Adicionar linhas em branco entre itens do texto PEP para melhor separação visual
- [x] Testar texto completo com todos os campos

## Ajustes no PDF e Impressão (04/02/2026)

- [x] Remover data do topo do PDF na versão HTML de impressão (requer desmarcar "Cabeçalhos e rodapés" no Chrome)
- [x] Remover telefone da gestante no PDF - substituído por História Obstétrica (G/P/A)
- [x] Testar impressão HTML sem data no topo
- [x] Testar PDF baixável sem telefone da gestante

## Ajustes no PDF e Impressão (04/02/2026)

- [x] Remover data do topo do PDF na versão HTML de impressão (requer desmarcar "Cabeçalhos e rodapés" no Chrome)
- [x] Remover telefone da gestante no PDF - substituído por História Obstétrica (G/P/A)
- [x] Testar impressão HTML sem data no topo
- [x] Testar PDF baixável sem telefone da gestante

## Correções no Cartão de Pré-natal HTML e PDF (04/02/2026)

- [x] Remover História Obstétrica duplicada na versão HTML
- [x] Corrigir seção "Dados do Ultrassom" para "Dados do Primeiro Ultrassom"
- [x] Corrigir labels: Data do 1º Ultrassom, IG no 1º Ultrassom, DPP pelo 1º Ultrassom
- [x] Remover Tipo de Parto Desejado/Indicado (HTML e PDF)
- [x] Remover Médico Responsável (HTML e PDF)
- [x] Remover Plano de Saúde (HTML e PDF)
- [x] Remover Telefone da gestante no PDF Profissional (pdf.ts e pdfTemplate.ts)
- [x] Testar versão HTML de impressão
- [x] Testar versão PDF profissional

## Geração de PDF com Puppeteer (04/02/2026)

- [x] Instalar Puppeteer no projeto (instalado, mas não funciona em produção)
- [x] Instalar html2canvas e jsPDF como alternativa
- [x] Testar várias abordagens (Puppeteer, iframe, html2canvas)
- [x] Implementar solução final: abrir página de impressão + window.print()
- [x] Renomear botão para "Imprimir / Salvar PDF"
- [x] Usuário usa "Salvar como PDF" no diálogo de impressão do navegador

Nota: A abordagem final é a mais confiável pois usa o motor de renderização nativo do navegador.

## Remoção do Botão Visualizar para Impressão (05/02/2026)

- [x] Remover botão "Visualizar para Impressão" do Cartão de Pré-natal

## Unificar Geração de PDF - Web e App Mobile (05/02/2026)

- [x] Analisar código de geração de PDF da interface web (CartaoPrenatalImpressao.tsx)
- [x] Analisar código de geração de PDF do endpoint gestante.gerarPdfCartao (gerarPdfCartao.ts - usava pdfkit)
- [x] Identificar diferenças entre os dois templates (pdfkit vs HTML)
- [x] Criar novo template HTML completo (pdfTemplateCompleto.ts)
- [x] Implementar conversão HTML para PDF com WeasyPrint (htmlToPdf.ts)
- [x] Atualizar endpoint gestante.gerarPdfCartao para usar novo template
- [x] Testar PDF gerado com WeasyPrint - resultado excelente, 1 página bem formatada

## Adicionar Gráficos ao PDF do App Mobile (05/02/2026)

- [ ] Instalar chartjs-node-canvas para gerar gráficos no servidor
- [ ] Criar funções para gerar gráficos de Peso, AU e PA como imagens base64
- [ ] Atualizar pdfTemplateCompleto.ts para incluir gráficos como imagens
- [ ] Atualizar endpoint gestante.gerarPdfCartao para passar dados dos gráficos
- [ ] Testar PDF com gráficos incluídos


## Gráficos no PDF do Cartão de Pré-natal (04/02/2026)
- [x] Instalar chartjs-node-canvas para gerar gráficos no servidor
- [x] Criar função gerarTodosGraficos() que gera 3 gráficos como imagens PNG base64
- [x] Implementar gráfico de Evolução do Peso
- [x] Implementar gráfico de Evolução da Altura Uterina (AU)
- [x] Implementar gráfico de Evolução da Pressão Arterial (PA sistólica e diastólica)
- [x] Atualizar template HTML (pdfTemplateCompleto.ts) para incluir gráficos como imagens
- [x] Corrigir comando WeasyPrint para usar Python 3.11 e evitar conflitos de versão
- [x] Testar geração de PDF com gestante TESTE TESTE - gráficos aparecem corretamente
- [x] PDF gerado pelo endpoint mobile (gestante.gerarPdfCartao) agora inclui gráficos idênticos à interface web



## Correção Erro Deploy canvas.node (05/02/2026)
- [x] Remover dependência chartjs-node-canvas que usa módulo nativo canvas
- [x] Implementar gráficos usando SVG puro (sem dependências nativas)
- [x] Substituir WeasyPrint por Puppeteer (100% JavaScript, sem dependências Python)
- [x] Usar SVG inline no HTML ao invés de imagens base64
- [x] Atualizar chartGenerator.ts para retornar SVG como string
- [x] Atualizar pdfTemplateCompleto.ts para inserir SVG inline
- [x] Testar geração de PDF localmente - gráficos aparecem corretamente
- [ ] Publicar versão corrigida e testar em produção


## Curvas de Referência nos Gráficos do PDF (05/02/2026)
- [x] Adicionar curva de percentil 10 (mínimo) no gráfico de AU
- [x] Adicionar curva de percentil 90 (máximo) no gráfico de AU
- [x] Adicionar área sombreada entre percentis 10-90 no gráfico de AU
- [x] Adicionar linha de limite de hipertensão (140/90) no gráfico de PA
- [x] Testar geração de PDF com curvas de referência

## Botão Copiar Texto PEP de Consultas Anteriores (05/02/2026)
- [ ] Analisar onde o texto PEP é armazenado nas consultas
- [ ] Criar componente de visualização do texto PEP em modal/dialog
- [ ] Adicionar botão de copiar na lista de consultas anteriores
- [ ] Implementar função de copiar para área de transferência
- [ ] Testar funcionalidade de visualização e cópia


## Botão Copiar Texto PEP de Consultas Anteriores (05/02/2026)
- [x] Analisar estrutura atual de consultas e texto PEP
- [x] Criar função gerarTextoPEPConsultaAnterior para gerar texto PEP a partir de dados do banco
- [x] Adicionar botão de copiar (ícone Copy) na coluna de ações da tabela de histórico
- [x] Criar modal "Texto PEP - Consulta Anterior" para visualizar e copiar o texto
- [x] Testar funcionalidade - modal abre corretamente com texto formatado


## Correção PDF Mobile - jsPDF (05/02/2026)
- [x] Substituir Puppeteer por jsPDF (100% JavaScript, sem dependências de sistema)
- [x] Implementar geração de PDF com jsPDF incluindo gráficos SVG
- [x] Testar geração de PDF localmente - PDF de 3 páginas gerado com sucesso
- [ ] Publicar e testar em produção

## Bug Fuso Horário e Unificação de Janelas na Consulta (09/02/2026)
- [x] Investigar as duas janelas que abrem ao clicar em Consulta no Dashboard
- [x] Corrigir bug de fuso horário que mostra data 1 dia a menos (adicionado T12:00:00 nas datas)
- [x] Unificar as duas janelas em uma única janela com todas as informações (ConsultaUnificadaDialog)
- [x] Corrigir botão Consulta no GestantesLayout e FormularioGestante para usar skipInfoModal
- [x] Testar correção - diálogo unificado funciona corretamente com todas as informações

## Correções 09/02/2026 - Lote 2
- [x] Remover flash do ModalInfoGestante ao iniciar consulta (removido do fluxo de nova consulta)
- [x] Corrigir IG com 1 dia a menos - normalizar datas com normalizarData() e usar Math.round
- [x] Adicionar campo Edema no formulário de registro de consulta (select com 5 opções)
- [x] Adicionar coluna edema no banco de dados
- [x] Atualizar texto PEP para mostrar edema salvo no banco
- [x] Atualizar router do servidor para aceitar campo edema

## Remoção Completa do ModalInfoGestante do Fluxo de Consulta (09/02/2026)
- [x] Identificar todos os pontos onde ModalInfoGestante é chamado no fluxo de consulta
- [x] Remover ModalInfoGestante completamente do CartaoPrenatal.tsx
- [x] Remover ModalInfoGestante completamente do GestantesLayout.tsx
- [x] Verificar e remover de qualquer outro componente no fluxo de consulta (Dashboard já limpo)
- [x] Testado - servidor rodando sem erros, nenhuma referência restante ao modal no fluxo

## Remover Campo Apresentação Fetal do Texto PEP (09/02/2026)
- [x] Remover campo Apresentação Fetal do texto PEP gerado no formulário de nova consulta
- [x] Remover Apresentação Fetal do texto PEP gerado no histórico de consultas
- [x] Verificado - servidor rodando sem erros, campo não aparece mais no texto PEP

## Wizard Pré-Natal 1ª Consulta (09/02/2026)
- [x] Adicionar campos no banco: isPrimeiraConsulta, historiaPatologicaPregressa, historiaSocial, historiaFamiliar, condutaCheckboxes (JSON)
- [x] Atualizar router do servidor para aceitar novos campos
- [x] Criar componente WizardPrimeiraConsulta com 3 etapas (Anamnese, Exame Físico, Conduta)
- [x] Etapa 1: Dados automáticos (Paridade, IG DUM, IG US, DPP) + campos de história
- [x] Etapa 2: Queixas, Peso, PA, AUF, BCF, Edema
- [x] Etapa 3: Checkboxes de conduta (20 opções) + complementação + observações
- [x] Barra de progresso visual entre etapas
- [x] Integrar Wizard no Dashboard (botão 1ª Consulta no ConsultaUnificadaDialog)
- [x] Integrar Wizard no CartaoPrenatal (via ConsultaUnificadaDialog)
- [x] Gerar texto PEP específico para 1ª consulta com todos os campos
- [x] Testar fluxo completo - testes vitest passando

## Formatação do Texto PEP - Negrito e Mesma Linha (09/02/2026)
- [x] Formatar rótulos em negrito no texto PEP do Wizard 1ª Consulta
- [x] Formatar rótulos em negrito no texto PEP do formulário de consulta normal (CartaoPrenatal)
- [x] Formatar rótulos em negrito no texto PEP do histórico de consultas (CartaoPrenatal)
- [x] Manter dados na mesma linha do rótulo (ex: **Peso:** 68.5kg)

## Abrir Janela PEP ao Atualizar Consulta (09/02/2026)
- [x] Localizar função handleUpdate no CartaoPrenatal
- [x] Modificar handleUpdate para gerar texto PEP após atualização bem-sucedida
- [x] Abrir modal de PEP automaticamente após atualização

## Negrito Real no Texto PEP - Unicode Bold (09/02/2026)
- [x] Criar função toBold() que converte texto para Unicode Mathematical Bold
- [x] Substituir asteriscos Markdown por Unicode bold no WizardPrimeiraConsulta
- [x] Substituir asteriscos Markdown por Unicode bold no CartaoPrenatal (gerarTextoPEP)
- [x] Substituir asteriscos Markdown por Unicode bold no CartaoPrenatal (gerarTextoPEPConsultaAnterior)

## Reorganizar Layout do Cartão de Pré-natal (09/02/2026)
- [x] Mover "Data Planejada para a Cesárea" para após o Formulário de Consulta
- [x] Mover "Marcos Importantes" para após Data Planejada para a Cesárea
- [x] Mover "Dados do Bebê" para após Marcos Importantes

## Texto PEP Simples sem Negrito (09/02/2026)
- [x] Remover toBold() do WizardPrimeiraConsulta
- [x] Remover toBold() do CartaoPrenatal (gerarTextoPEP e gerarTextoPEPConsultaAnterior)
- [x] Manter rótulo e dado na mesma linha (formato: "Rótulo: dado")

## Mover Histórico de Consultas (09/02/2026)
- [x] Mover "Histórico de Consultas" para logo abaixo do Formulário de Nova Consulta

## Reorganizar Layout - Dados do Bebê e Marcos (09/02/2026)
- [x] Mover "Dados do Bebê" para logo após "Data da Cesárea"
- [x] Mover "Marcos Importantes" para logo após "Dados do Bebê"

## Autocomplete no Campo Queixas (10/02/2026)
- [x] Implementar autocomplete no campo "Queixas" com textos mais utilizados em pré-natal

## Autocomplete Queixas no Wizard 1ª Consulta (10/02/2026)
- [x] Adicionar AutocompleteInput no campo Queixas do WizardPrimeiraConsulta

## Centralizar Lista de Sugestões de Queixas (10/02/2026)
- [x] Criar arquivo compartilhado com lista de sugestões de queixas
- [x] Atualizar CartaoPrenatal para importar do arquivo centralizado
- [x] Atualizar WizardPrimeiraConsulta para importar do arquivo centralizado

## Melhorias no Wizard 1ª Consulta (10/02/2026)
- [x] Autocomplete nos campos HPP, Hist Social e Hist Familiar do Wizard
- [x] Opção "Útero não palpável" no campo AUF do Wizard
- [x] Após salvar Wizard, redirecionar para CartaoPrenatal com modal PEP aberto
- [x] Após copiar PEP, scroll automático para Marcos Importantes

## Bug: Erro trim ao iniciar consulta de retorno (10/02/2026)
- [x] Corrigir "Cannot read properties of undefined (reading 'trim')" ao iniciar consulta de retorno

## Nome do Bebê no ConsultaUnificadaDialog (10/02/2026)
- [x] Adicionar nome do bebê na janela inicial que abre ao iniciar uma consulta

## Observações no Texto PEP da Consulta de Retorno (10/02/2026)
- [x] Adicionar campo "Observações" no texto PEP da consulta de retorno (gerarTextoPEP)
- [x] Adicionar campo "Observações" no texto PEP do histórico de consultas (gerarTextoPEPConsultaAnterior) - já existia

## Compactar Card Dados da Gestante (10/02/2026)
- [x] Reduzir espaço vertical do card "Dados da Gestante" no CartaoPrenatal

## Autocomplete Global e Ordenação por Frequência (10/02/2026)
- [x] Adicionar "Queixas comuns dessa fase da gestação..." como primeira opção em queixas
- [x] Ordenar sugestões por mais utilizados/novos no topo em todas as caixas de texto
- [x] Aplicar autocomplete em todos os campos de texto livre: Wizard 1ª consulta, Ultrassons, complementação de conduta, observações

## Highlight nas Sugestões de Autocomplete (10/02/2026)
- [x] Criar função utilitária highlightMatch para destacar texto correspondente
- [x] Aplicar highlight no AutocompleteInput (campo Queixas)
- [x] Aplicar highlight no TextareaComAutocomplete (todos os campos de texto livre)
- [x] Testes unitários para lógica de matching

## Navegação por Teclado no AutocompleteInput (10/02/2026)
- [x] Adicionar estado para índice selecionado (indiceSelecionado)
- [x] Implementar handler de teclado (ArrowDown, ArrowUp, Enter, Escape)
- [x] Destacar visualmente o item selecionado na lista
- [x] Scroll automático para manter item selecionado visível

## Atalho Tab para Aceitar Primeira Sugestão (10/02/2026)
- [x] Implementar Tab no AutocompleteInput para aceitar primeira sugestão (ou selecionada)
- [x] Implementar Tab no TextareaComAutocomplete para aceitar primeira sugestão (ou selecionada)
- [x] Testes unitários para lógica do Tab

## Tooltip com Atalhos de Teclado no Autocomplete (10/02/2026)
- [x] Verificar se componente Tooltip existe no projeto
- [x] Adicionar tooltip no AutocompleteInput com atalhos (Tab, ↑↓, Enter, Esc)
- [x] Adicionar tooltip no TextareaComAutocomplete com atalhos (Tab, ↑↓, Enter, Esc)
- [x] Testar visualmente em diferentes campos

## Destaque para Sugestão Mais Usada no Autocomplete (10/02/2026)
- [x] Adicionar badge/ícone "Mais Usado" na primeira sugestão do AutocompleteInput
- [x] Adicionar badge/ícone "Mais Usado" na primeira sugestão do TextareaComAutocomplete
- [x] Usar ícone Star ou badge visual discreto
- [x] Testar visualmente em diferentes campos

## Bug: Botão Nova Consulta no GestantesLayout (10/02/2026)
- [x] Investigar botão na linha ~174 do GestantesLayout que não funciona como os outros botões de consulta
- [x] Corrigir comportamento para ser consistente com botão Nova Consulta da página principal e do card (setLocation -> window.location.href)
- [x] Integrar ConsultaUnificadaDialog no GestantesLayout para abrir diálogo com lembretes antes de redirecionar
- [x] Incluir WizardPrimeiraConsulta para fluxo de 1ª consulta

## Bug: Erro tRPC retornando HTML ao invés de JSON (10/02/2026)
- [ ] Investigar erro "Unexpected token '<', <!doctype..." na página /dashboard
- [ ] Verificar qual query tRPC está falhando
- [ ] Corrigir a causa raiz

## Bug: Campo Queixas concatena texto ao invés de substituir (10/02/2026)
- [x] Ao selecionar sugestão no AutocompleteInput (Queixas), o texto digitado é concatenado com o sugerido ao invés de ser substituído
- [x] Corrigir lógica de seleção no AutocompleteInput para substituir o texto digitado pelo sugerido

## Novas Opções de Conduta: Ferro Venoso e Aguardo Exames (10/02/2026)
- [x] Adicionar checkbox "Ferro Venoso" nas opções de conduta da consulta de retorno
- [x] Adicionar checkbox "Aguardo exames laboratoriais" nas opções de conduta da consulta de retorno
- [x] Adicionar checkbox "Ferro Venoso" nas opções de conduta da 1ª consulta (Wizard)
- [x] Adicionar checkbox "Aguardo exames laboratoriais" nas opções de conduta da 1ª consulta (Wizard)

## Sistema de Lembretes de Conduta (10/02/2026)
- [x] Criar tabela lembretes_conduta no schema (gestanteId, consultaId, conduta, resolvido, criadoEm, resolvidoEm)
- [x] Rodar migração do banco (pnpm db:push)
- [x] Criar helpers no db.ts para lembretes (criar, listar pendentes, resolver)
- [x] Criar routers tRPC para lembretes (listar pendentes por gestante, resolver lembrete)
- [x] Gerar lembretes automaticamente ao salvar consulta (condutas 1-10 e 20)
- [x] Exibir lembretes pendentes no formulário de nova consulta com checkboxes
- [x] Ao marcar checkbox do lembrete, resolver (sumir na próxima consulta)
- [x] Ao salvar consulta, resolver lembretes marcados
- [x] Lembretes não marcados persistem para próxima consulta

## Lembretes Retroativos para Consultas Existentes (10/02/2026)
- [x] Varrer todas as consultas existentes no banco
- [x] Identificar última consulta de cada gestante com condutas que geram lembrete
- [x] Gerar lembretes retroativos para essas gestantes (74 gestantes, 110 lembretes)
- [x] Verificar resultados no banco (110 lembretes pendentes)

## Consulta de Urgência Obstétrica (10/02/2026)
- [x] Criar formulário de Consulta de Urgência Obstétrica com campos:
  - Idade Gestacional, Queixas (checkboxes), Detalhamento da Queixa, Pressão Arterial, AUF, Atividade Uterina (checkboxes), Toque Vaginal, USG Hoje, Hipótese Diagnóstica, Condutas (checkboxes), Conduta Complementação
- [x] Queixas: Sangramento Vaginal, Dor em Baixo Ventre/Abdominal, Dor abaixo do rebordo costal, Lombalgia, Cefaleia, Perda de Líquido, Febre, Dispneia, Elevação dos Níveis Pressóricos, Sintomas de Resfriado, Contrações Uterinas, Outra (Descreva Abaixo)
- [x] Condutas: Orientações, Exames Laboratoriais, Progesterona Micronizada, Analgésicos, US de Rins e Vias Urinárias, US de Fígado e Vias Biliares, Internação Hospitalar, Indicação Curetagem, Indicação Cesárea, Outra Conduta (com descrição)
- [x] Condutas com lembrete: 2 (Exames Laboratoriais), 5 (US Rins), 6 (US Fígado), 10 (Outra Conduta - descrição no lembrete)
- [x] Atividade Uterina: Ausência/Não é Possível, Útero Não Palpável (1º Tri), Ausente — Tônus Uterino Normal, Contrações de Braxton-Hicks, Trabalho de Parto (>5DU/Montevidéu)
- [x] Auto-texto com todas as features em campos de texto (Detalhamento, AUF, Toque Vaginal, USG Hoje, Hipótese Diagnóstica, Conduta Complementação, Outra Conduta)
- [x] Botão "Urgência" no ConsultaUnificadaDialog junto com 1ª Consulta e Consulta de Retorno
- [x] Integrar lembretes no sistema existente
- [x] Salvar consulta de urgência no banco

## Menu de Opções no Botão Consulta da Sidebar (11/02/2026)
- [x] Modificar botão Consulta no menu lateral para abrir menu com 3 opções
- [x] Opção 1: 1ª Consulta (abre WizardPrimeiraConsulta)
- [x] Opção 2: Consulta de Retorno (redireciona para CartaoPrenatal)
- [x] Opção 3: Consulta de Urgência (redireciona para ConsultaUrgencia)

## Bug: Botões não cabem no ConsultaUnificadaDialog (11/02/2026)
- [x] Reorganizar botões em duas linhas para caber na janela do diálogo

## Substituir Dropdown por ConsultaUnificadaDialog na Sidebar (11/02/2026)
- [x] Remover DropdownMenu do botão Consulta na sidebar
- [x] Abrir ConsultaUnificadaDialog ao clicar no botão Consulta (mesmo comportamento do Dashboard)

## Badge de Urgência no Histórico de Consultas (11/02/2026)
- [x] Adicionar badge vermelho "Urgência" no histórico de consultas do Cartão de Pré-natal
- [x] Identificar consultas de urgência pelo campo tipoConsulta === 'urgencia'
- [x] Exibir informações específicas da urgência (hipótese diagnóstica) na coluna Observações

## Auto-texto nos Campos de Texto Livre do Wizard de 1ª Consulta (11/02/2026)
- [x] Identificar os 3 campos de texto livre da 1ª página do Wizard
- [x] Substituir textareas simples por TextareaComAutocomplete com todas as features
- [x] Verificar que highlight, navegação por teclado, Tab e tooltip funcionam

## Correção do Autocomplete - Sugestões não apareciam + Escape fechava Dialog (11/02/2026)
- [x] Corrigir sugestões não aparecendo ao abrir o Wizard (onFocus chamado antes dos dados da API)
- [x] Adicionar useEffect para mostrar sugestões quando dados carregam com campo focado
- [x] Adicionar lógica para mostrar sugestões ao digitar (handleChange)
- [x] Corrigir Escape que fechava o Dialog inteiro em vez de apenas as sugestões
- [x] Adicionar data-autocomplete-dropdown e onEscapeKeyDown no DialogContent
- [x] Adicionar flag dismissedByEscape para evitar reabertura indesejada

## Autocomplete nos Campos de Texto da Consulta de Urgência (11/02/2026)
- [x] Identificar campos de texto livre na Consulta de Urgência (6 campos: detalhamento queixa, AUF, toque vaginal, USG hoje, hipótese diagnóstica, conduta complementação)
- [x] Criar tipos específicos no schema (hipotese_diagnostica, detalhamento_queixa_urgencia, toque_vaginal, usg_hoje, auf_urgencia)
- [x] Atualizar enum no banco de dados e no router tRPC
- [x] Atualizar campos da ConsultaUrgencia para usar tipos específicos
- [x] Testar autocomplete funcionando com sugestões aparecendo ao focar no campo
- [x] Nota: Consulta de Urgência é página completa (não Dialog), não precisa proteção de Escape

## Autocomplete no Campo 'Outra Conduta' da Consulta de Urgência (12/02/2026)
- [x] Identificar como o campo Outra Conduta é renderizado (já usava TextareaComAutocomplete com tipo genérico)
- [x] Criar tipo específico outra_conduta_urgencia no schema, router e banco
- [x] Alterar campo para usar tipo específico outra_conduta_urgencia
- [x] Testar autocomplete funcionando no campo Outra Conduta
