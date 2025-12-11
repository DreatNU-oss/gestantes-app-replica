import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MessageSquare, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface EnviarLembreteWhatsAppProps {
  gestanteId: number;
  gestanteNome: string;
  telefone?: string | null;
}

export function EnviarLembreteWhatsApp({
  gestanteId,
  gestanteNome,
  telefone,
}: EnviarLembreteWhatsAppProps) {
  const [open, setOpen] = useState(false);
  const [templateId, setTemplateId] = useState<string>("");
  const [dataConsulta, setDataConsulta] = useState("");
  const [horario, setHorario] = useState("");
  const [tipoExame, setTipoExame] = useState("");
  // Toast já importado do sonner

  const { data: templates } = trpc.whatsapp.listarTemplates.useQuery();
  const enviarMutation = trpc.whatsapp.enviarLembrete.useMutation({
    onSuccess: () => {
      toast.success("Mensagem enviada!", {
        description: "O lembrete foi enviado via WhatsApp com sucesso.",
      });
      setOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error("Erro ao enviar mensagem", {
        description: error.message,
      });
    },
  });

  const resetForm = () => {
    setTemplateId("");
    setDataConsulta("");
    setHorario("");
    setTipoExame("");
  };

  const handleEnviar = () => {
    if (!templateId) {
      toast.error("Selecione um template", {
        description: "Por favor, selecione o tipo de lembrete que deseja enviar.",
      });
      return;
    }

    // Validar campos específicos
    if (templateId === "lembrete_consulta" && (!dataConsulta || !horario)) {
      toast.error("Campos obrigatórios", {
        description: "Preencha a data e horário da consulta.",
      });
      return;
    }

    if (templateId === "lembrete_exame" && !tipoExame) {
      toast.error("Campo obrigatório", {
        description: "Informe o tipo de exame.",
      });
      return;
    }

    enviarMutation.mutate({
      gestanteId,
      templateId: templateId as any,
      dataConsulta: dataConsulta || undefined,
      horario: horario || undefined,
      tipoExame: tipoExame || undefined,
    });
  };

  // Verificar se tem telefone cadastrado
  if (!telefone) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm text-amber-800">
          ⚠️ Telefone não cadastrado. Adicione um telefone para enviar lembretes via WhatsApp.
        </p>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <MessageSquare className="h-4 w-4" />
          Enviar Lembrete WhatsApp
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Enviar Lembrete via WhatsApp</DialogTitle>
          <DialogDescription>
            Envie um lembrete para {gestanteNome} no número {telefone}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="template">Tipo de Lembrete</Label>
            <Select value={templateId} onValueChange={setTemplateId}>
              <SelectTrigger id="template">
                <SelectValue placeholder="Selecione o tipo de lembrete" />
              </SelectTrigger>
              <SelectContent>
                {templates?.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Campos específicos para lembrete de consulta */}
          {templateId === "lembrete_consulta" && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="dataConsulta">Data da Consulta</Label>
                <Input
                  id="dataConsulta"
                  type="date"
                  value={dataConsulta}
                  onChange={(e) => setDataConsulta(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="horario">Horário</Label>
                <Input
                  id="horario"
                  type="time"
                  value={horario}
                  onChange={(e) => setHorario(e.target.value)}
                  placeholder="Ex: 14:30"
                />
              </div>
            </>
          )}

          {/* Campo específico para lembrete de exame */}
          {templateId === "lembrete_exame" && (
            <div className="grid gap-2">
              <Label htmlFor="tipoExame">Tipo de Exame</Label>
              <Input
                id="tipoExame"
                value={tipoExame}
                onChange={(e) => setTipoExame(e.target.value)}
                placeholder="Ex: Ultrassom Morfológico"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setOpen(false);
              resetForm();
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleEnviar}
            disabled={enviarMutation.isPending}
            className="gap-2"
          >
            {enviarMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <MessageSquare className="h-4 w-4" />
                Enviar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
