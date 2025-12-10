# Análise do Formulário Atual vs Print Original

## Campos Presentes no Formulário Atual

**Dados Pessoais:**
- ✅ Nome Completo
- ✅ Data de Nascimento
- ✅ Telefone
- ✅ E-mail

**Dados Administrativos:**
- ✅ Plano de Saúde
- ✅ Carteirinha Unimed
- ✅ Médico Responsável
- ✅ Tipo de Parto Desejado

**História Obstétrica:**
- ✅ Gesta
- ✅ Para
- ✅ Partos Normais
- ✅ Cesáreas
- ✅ Abortos

**Dados Obstétricos:**
- ✅ DUM (Data da Última Menstruação)
- ✅ Data do Ultrassom
- ✅ IG Ultrassom (Semanas)
- ✅ IG Ultrassom (Dias)

## Campos Faltantes (Comparado ao Print)

- ❌ **Data Planejada para o Parto** (dataPartoProgramado) - existe no schema mas não está no formulário
- ❌ **Observações** (observacoes) - acabamos de adicionar ao schema mas não está no formulário

## Ação Necessária

Adicionar ao formulário:
1. Campo "Data Planejada para o Parto" (date input)
2. Campo "Observações" (textarea)
