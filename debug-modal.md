# Debug: Modal de Iniciar Consulta não aparece

## Problema Identificado

O `handleSuccess` no Dashboard.tsx chama `setShowForm(false)` na linha 204, o que desmonta o componente `FormularioGestante` ANTES do modal ter chance de aparecer.

## Fluxo Atual:
1. Usuário clica em Salvar
2. createMutation.onSuccess é chamado
3. onSuccess(data) é chamado (que é handleSuccess do Dashboard)
4. handleSuccess chama setShowForm(false) → FormularioGestante é desmontado
5. setShowStartConsultaModal(true) é chamado MAS o componente já foi desmontado

## Solução:
O Dashboard já tem seu próprio diálogo de confirmação de consulta (showConsultaDialog). 
Podemos remover o modal do FormularioGestante e usar apenas o do Dashboard, OU
modificar para que o FormularioGestante não chame onSuccess até o modal ser fechado.

## Opção escolhida:
Usar o diálogo do Dashboard que já existe e adicionar as informações de IG e História Obstétrica nele.
