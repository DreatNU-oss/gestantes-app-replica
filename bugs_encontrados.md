# Bugs Encontrados no Cartão de Pré-Natal - Vivian Mantovani

## 1. Dados de Gesta/Para não aparecem
**Observado:** 
- Gesta: - (vazio)
- Para: - (vazio)
- Partos Normais: - (vazio)
- Cesáreas: - (vazio)
- Abortos: - (vazio)

**Esperado:** Deveria mostrar os valores do banco de dados (Gesta: 2, Para: 1, etc.)

**Causa provável:** Os campos estão sendo retornados pelo backend mas aparecem como null/undefined no frontend

## 2. DPP pelo Ultrassom não aparece
**Observado:** DPP pelo Ultrassom: - (vazio)

**Esperado:** Deveria mostrar a data calculada (15/03/2026 conforme print do site original)

**Causa provável:** O campo dppUS pode não estar sendo calculado corretamente ou a gestante não tem dados de ultrassom

## 3. Marcos Importantes não aparecem
**Observado:** A seção de Marcos Importantes não é exibida

**Esperado:** Deveria mostrar os 9 marcos com botões de copiar

**Causa provável:** A condição `gestante.dataUltrassom` pode estar falhando ou os marcos não estão sendo renderizados

## 4. Histórico de Consultas não aparece
**Observado:** Não há seção de histórico de consultas visível

**Esperado:** Deveria mostrar a consulta registrada hoje (09/12/2025)

**Causa provável:** A query pode não estar retornando consultas ou há problema na renderização condicional

## Próximos passos:
1. Verificar se os dados estão no banco (SQL query)
2. Verificar se o backend está retornando os dados corretamente
3. Verificar se o frontend está acessando os campos corretos
4. Corrigir renderização condicional dos marcos e consultas
