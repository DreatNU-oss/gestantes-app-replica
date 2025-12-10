# Faixas Ideais de Ganho de Peso Gestacional

## Ganho Total Recomendado (por IMC pré-gestacional)

- **Baixo peso (IMC < 18,5):** 12,5–18 kg
- **Peso adequado (IMC 18,5–24,9):** 11,5–16 kg
- **Sobrepeso (IMC 25–29,9):** 7–11,5 kg
- **Obesidade (IMC ≥ 30):** 5–9 kg

## Taxas Semanais de Ganho de Peso (2º e 3º trimestres)

**Primeiro trimestre (até ~13 semanas):**
- Ganho pequeno: ~0,5–2 kg no 1º trimestre para todos os IMCs
- Muitas gestantes de peso normal ou baixo peso ganham pouco ou não ganham peso nesse período

**Segundo e terceiro trimestres (semanas ~14 até 40):**
- **Baixo peso:** 0,44–0,58 kg/semana
- **Peso adequado:** 0,35–0,50 kg/semana
- **Sobrepeso:** 0,23–0,33 kg/semana
- **Obesidade:** 0,17–0,27 kg/semana

## Gráfico de Referência

O gráfico mostra faixas coloridas por categoria de IMC:
- **Azul:** Baixo peso (IMC < 18,5)
- **Verde:** Peso adequado (IMC 18,5–24,9)
- **Laranja:** Sobrepeso (IMC 25–29,9)
- **Vermelho:** Obesidade (IMC ≥ 30)

Cada faixa mostra o ganho de peso mínimo e máximo acumulado ideal por semana de gestação (de 2 até 42 semanas).

## Implementação no Gráfico

1. Calcular IMC pré-gestacional = peso inicial / (altura em metros)²
2. Determinar categoria de IMC
3. Plotar faixa de ganho ideal (área sombreada) baseada nas taxas semanais
4. Plotar pontos de peso real das consultas
5. Mostrar se a gestante está dentro, acima ou abaixo da faixa ideal
