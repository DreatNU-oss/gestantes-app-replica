// Teste de formatação de data
const dataPartoProgramado = "2025-12-15";

// Método 1: new Date() direto (pode causar problema de timezone)
const date1 = new Date(dataPartoProgramado);
console.log("Método 1 (new Date direto):", date1.toLocaleDateString("pt-BR"));
console.log("  - toString:", date1.toString());
console.log("  - toISOString:", date1.toISOString());

// Método 2: parseLocalDate (correto)
const [year, month, day] = dataPartoProgramado.split('-').map(Number);
const date2 = new Date(year, month - 1, day, 12, 0, 0);
console.log("\nMétodo 2 (parseLocalDate):", date2.toLocaleDateString("pt-BR"));
console.log("  - toString:", date2.toString());
console.log("  - toISOString:", date2.toISOString());

// Método 3: Formatação manual
const formatarData = (dateStr) => {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
};
console.log("\nMétodo 3 (formatação manual):", formatarData(dataPartoProgramado));
