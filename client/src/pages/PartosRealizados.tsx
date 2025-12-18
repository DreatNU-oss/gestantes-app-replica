import { useState } from "react";
import GestantesLayout from "@/components/GestantesLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileText, Download, Trash2 } from "lucide-react";
import { toast } from "sonner";

// Função para formatar data de forma segura
const formatarDataSegura = (dateValue: Date | string | null | undefined): string => {
  if (!dateValue) return "-";
  
  // Se for string no formato YYYY-MM-DD, parsear manualmente
  if (typeof dateValue === 'string') {
    const [year, month, day] = dateValue.split('T')[0].split('-').map(Number);
    if (year && month && day) {
      return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
    }
  }
  
  // Se for Date object, usar getUTC para evitar shift de timezone
  const date = new Date(dateValue);
  if (isNaN(date.getTime())) return "-";
  
  const dia = String(date.getUTCDate()).padStart(2, '0');
  const mes = String(date.getUTCMonth() + 1).padStart(2, '0');
  const ano = date.getUTCFullYear();
  return `${dia}/${mes}/${ano}`;
};

export default function PartosRealizados() {
  const { data: partos, isLoading } = trpc.partos.listar.useQuery();
  const utils = trpc.useUtils();

  const deleteMutation = trpc.partos.deletar.useMutation({
    onSuccess: () => {
      toast.success("Registro de parto removido com sucesso!");
      utils.partos.listar.invalidate();
    },
    onError: (error) => {
      toast.error("Erro ao remover registro: " + error.message);
    },
  });

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja remover este registro de parto?")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleDownloadPDF = (pdfUrl: string | null, gestanteNome: string | null) => {
    if (!pdfUrl) {
      toast.error("PDF não disponível");
      return;
    }

    // Abrir PDF em nova aba
    window.open(pdfUrl, "_blank");
  };

  return (
    <GestantesLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Partos Realizados</h1>
            <p className="text-muted-foreground mt-2">
              Histórico de partos realizados com cartões pré-natais
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Registros de Partos</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Carregando registros...</p>
              </div>
            ) : !partos || partos.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-muted-foreground">Nenhum parto registrado ainda</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Gestante</TableHead>
                    <TableHead>Data do Parto</TableHead>
                    <TableHead>Tipo de Parto</TableHead>
                    <TableHead>Médico</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {partos.map((parto, idx) => (
                    <TableRow key={parto.id}>
                      <TableCell className="font-medium">{idx + 1}</TableCell>
                      <TableCell className="font-medium">{parto.gestanteNome || "-"}</TableCell>
                      <TableCell>{formatarDataSegura(parto.dataParto)}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-block px-3 py-1 rounded text-xs font-medium ${
                            parto.tipoParto === "normal"
                              ? "bg-green-100 text-green-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {parto.tipoParto === "normal" ? "Normal" : "Cesárea"}
                        </span>
                      </TableCell>
                      <TableCell>{parto.medicoNome || "-"}</TableCell>
                      <TableCell>{parto.gestanteTelefone || "-"}</TableCell>
                      <TableCell>{parto.gestanteEmail || "-"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadPDF(parto.pdfUrl, parto.gestanteNome)}
                            title="Ver/Baixar Cartão Pré-natal"
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(parto.id)}
                            title="Excluir Registro"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Card informativo */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <h3 className="font-medium mb-1">Sobre os Cartões Pré-natais</h3>
                <p className="text-sm text-muted-foreground">
                  Quando um parto é registrado, o sistema gera automaticamente um PDF completo do cartão
                  pré-natal da gestante, incluindo todos os dados obstétricos, consultas, exames e
                  ultrassons realizados durante o pré-natal. Este documento fica armazenado e pode ser
                  acessado a qualquer momento clicando no ícone de documento.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </GestantesLayout>
  );
}
