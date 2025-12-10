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
- [ ] Geração de cartão pré-natal em PDF
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
- [ ] Implementar página de Exames Laboratoriais completa
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
