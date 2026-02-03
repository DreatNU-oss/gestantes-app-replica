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
