# Teste de Datas DPP - Vivian Mantovani Lopes e Silva

## Dados no Sistema Atual

**Vivian Mantovani Lopes e Silva** (linha 2 da tabela filtrada):
- **IG (DUM):** NaNs NaNd - 3º Tri (badge rosa)
- **DPP (DUM):** - (vazio)
- **IG (US):** NaNs NaNd - 3º Tri (badge rosa)
- **DPP (US):** - (vazio)

## Problema Identificado

As datas de DPP não estão aparecendo (mostram "-" vazio), e a IG está mostrando "NaNs NaNd" (Not a Number).

Isso indica que o cálculo está falhando completamente, não apenas com diferença de 1 dia.

## Dados Esperados (do CSV original)

- **DUM:** 2025-06-04
- **Data Ultrassom:** 2025-07-28
- **IG Ultrassom:** 7 semanas e 1 dia
- **DPP esperada pela DUM:** 11/03/2026 (DUM + 280 dias)
- **DPP esperada pelo US:** 16/03/2026

## Próximos Passos

1. Verificar por que o cálculo está retornando NaN
2. Verificar se as datas estão sendo lidas corretamente do banco
3. Testar a correção de fuso horário aplicada


## Após Correção de Conversão de Datas

**Vivian Mantovani Lopes e Silva:**
- **IG DUM:** 27s 0d - 2º Tri ✅
- **DPP pela DUM:** 10/03/2026 ❓ (esperado: 11/03/2026?)
- **IG US:** 26s 3d - 2º Tri ✅
- **DPP pelo US:** 14/03/2026 ❓ (esperado: 15/03/2026?)

**Status:** Datas agora aparecem (não é mais NaN), mas podem estar 1 dia antes do esperado.

**Aguardando confirmação do usuário sobre as datas corretas.**
