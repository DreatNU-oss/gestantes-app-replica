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
