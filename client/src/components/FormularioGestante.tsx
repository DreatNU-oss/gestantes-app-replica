import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

interface FormularioGestanteProps {
  gestanteId?: number | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function FormularioGestante({
  gestanteId,
  onSuccess,
  onCancel,
}: FormularioGestanteProps) {
  const [formData, setFormData] = useState({
    nome: "",
    telefone: "",
    email: "",
    dataNascimento: "",
    planoSaudeId: "",
    carteirinhaUnimed: "",
    medicoId: "",
    tipoPartoDesejado: "a_definir" as "cesariana" | "normal" | "a_definir",
    gesta: "",
    para: "",
    partosNormais: "",
    cesareas: "",
    abortos: "",
    dum: "",
    igUltrassomSemanas: "",
    igUltrassomDias: "",
    dataUltrassom: "",
  });

  const { data: gestante } = trpc.gestantes.get.useQuery(
    { id: gestanteId! },
    { enabled: !!gestanteId }
  );

  const { data: medicos = [] } = trpc.medicos.listar.useQuery();
  const { data: planos = [] } = trpc.planosSaude.listar.useQuery();

  const createMutation = trpc.gestantes.create.useMutation({
    onSuccess: () => {
      toast.success("Gestante cadastrada com sucesso!");
      onSuccess();
    },
    onError: (error) => {
      toast.error("Erro ao cadastrar gestante: " + error.message);
    },
  });

  const updateMutation = trpc.gestantes.update.useMutation({
    onSuccess: () => {
      toast.success("Gestante atualizada com sucesso!");
      onSuccess();
    },
    onError: (error) => {
      toast.error("Erro ao atualizar gestante: " + error.message);
    },
  });

  useEffect(() => {
    if (gestante) {
      setFormData({
        nome: gestante.nome || "",
        telefone: gestante.telefone || "",
        email: gestante.email || "",
        dataNascimento: gestante.dataNascimento ? (typeof gestante.dataNascimento === 'string' ? gestante.dataNascimento : gestante.dataNascimento.toISOString().split('T')[0]) : "",
        planoSaudeId: gestante.planoSaudeId?.toString() || "",
        carteirinhaUnimed: gestante.carteirinhaUnimed || "",
        medicoId: gestante.medicoId?.toString() || "",
        tipoPartoDesejado: gestante.tipoPartoDesejado || "a_definir",
        gesta: gestante.gesta?.toString() || "",
        para: gestante.para?.toString() || "",
        partosNormais: gestante.partosNormais?.toString() || "",
        cesareas: gestante.cesareas?.toString() || "",
        abortos: gestante.abortos?.toString() || "",
        dum: gestante.dum ? (typeof gestante.dum === 'string' ? gestante.dum : gestante.dum.toISOString().split('T')[0]) : "",
        igUltrassomSemanas: gestante.igUltrassomSemanas?.toString() || "",
        igUltrassomDias: gestante.igUltrassomDias?.toString() || "",
        dataUltrassom: gestante.dataUltrassom ? (typeof gestante.dataUltrassom === 'string' ? gestante.dataUltrassom : gestante.dataUltrassom.toISOString().split('T')[0]) : "",
      });
    }
  }, [gestante]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const data: any = {
      nome: formData.nome,
      telefone: formData.telefone || undefined,
      email: formData.email || undefined,
      dataNascimento: formData.dataNascimento || undefined,
      planoSaudeId: formData.planoSaudeId ? parseInt(formData.planoSaudeId) : undefined,
      carteirinhaUnimed: formData.carteirinhaUnimed || undefined,
      medicoId: formData.medicoId ? parseInt(formData.medicoId) : undefined,
      tipoPartoDesejado: formData.tipoPartoDesejado,
      gesta: formData.gesta ? parseInt(formData.gesta) : undefined,
      para: formData.para ? parseInt(formData.para) : undefined,
      partosNormais: formData.partosNormais ? parseInt(formData.partosNormais) : undefined,
      cesareas: formData.cesareas ? parseInt(formData.cesareas) : undefined,
      abortos: formData.abortos ? parseInt(formData.abortos) : undefined,
      dum: formData.dum || undefined,
      igUltrassomSemanas: formData.igUltrassomSemanas ? parseInt(formData.igUltrassomSemanas) : undefined,
      igUltrassomDias: formData.igUltrassomDias ? parseInt(formData.igUltrassomDias) : undefined,
      dataUltrassom: formData.dataUltrassom || undefined,
    };

    if (gestanteId) {
      updateMutation.mutate({ id: gestanteId, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h2 className="text-3xl font-bold text-foreground">
            {gestanteId ? "Editar Gestante" : "Nova Gestante"}
          </h2>
          <p className="text-muted-foreground">
            Preencha os dados da gestante
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Dados Pessoais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome Completo *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataNascimento">Data de Nascimento</Label>
                <Input
                  id="dataNascimento"
                  type="date"
                  value={formData.dataNascimento}
                  onChange={(e) => setFormData({ ...formData, dataNascimento: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dados Administrativos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="planoSaudeId">Plano de Saúde</Label>
                <Select
                  value={formData.planoSaudeId}
                  onValueChange={(v) => setFormData({ ...formData, planoSaudeId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Nenhum</SelectItem>
                    {planos.map(p => (
                      <SelectItem key={p.id} value={p.id.toString()}>{p.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="carteirinhaUnimed">Carteirinha Unimed</Label>
                <Input
                  id="carteirinhaUnimed"
                  value={formData.carteirinhaUnimed}
                  onChange={(e) => setFormData({ ...formData, carteirinhaUnimed: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="medicoId">Médico Responsável</Label>
                <Select
                  value={formData.medicoId}
                  onValueChange={(v) => setFormData({ ...formData, medicoId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Nenhum</SelectItem>
                    {medicos.map(m => (
                      <SelectItem key={m.id} value={m.id.toString()}>{m.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tipoPartoDesejado">Tipo de Parto Desejado</Label>
                <Select
                  value={formData.tipoPartoDesejado}
                  onValueChange={(v: any) => setFormData({ ...formData, tipoPartoDesejado: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="a_definir">A definir</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="cesariana">Cesárea</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>História Obstétrica</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gesta">Gesta</Label>
                <Input
                  id="gesta"
                  type="number"
                  min="0"
                  value={formData.gesta}
                  onChange={(e) => setFormData({ ...formData, gesta: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="para">Para</Label>
                <Input
                  id="para"
                  type="number"
                  min="0"
                  value={formData.para}
                  onChange={(e) => setFormData({ ...formData, para: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="partosNormais">Partos Normais</Label>
                <Input
                  id="partosNormais"
                  type="number"
                  min="0"
                  value={formData.partosNormais}
                  onChange={(e) => setFormData({ ...formData, partosNormais: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cesareas">Cesáreas</Label>
                <Input
                  id="cesareas"
                  type="number"
                  min="0"
                  value={formData.cesareas}
                  onChange={(e) => setFormData({ ...formData, cesareas: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="abortos">Abortos</Label>
                <Input
                  id="abortos"
                  type="number"
                  min="0"
                  value={formData.abortos}
                  onChange={(e) => setFormData({ ...formData, abortos: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dados Obstétricos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dum">DUM (Data da Última Menstruação)</Label>
                <Input
                  id="dum"
                  type="date"
                  value={formData.dum}
                  onChange={(e) => setFormData({ ...formData, dum: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataUltrassom">Data do Ultrassom</Label>
                <Input
                  id="dataUltrassom"
                  type="date"
                  value={formData.dataUltrassom}
                  onChange={(e) => setFormData({ ...formData, dataUltrassom: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="igUltrassomSemanas">IG Ultrassom (Semanas)</Label>
                <Input
                  id="igUltrassomSemanas"
                  type="number"
                  min="0"
                  max="42"
                  value={formData.igUltrassomSemanas}
                  onChange={(e) => setFormData({ ...formData, igUltrassomSemanas: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="igUltrassomDias">IG Ultrassom (Dias)</Label>
                <Input
                  id="igUltrassomDias"
                  type="number"
                  min="0"
                  max="6"
                  value={formData.igUltrassomDias}
                  onChange={(e) => setFormData({ ...formData, igUltrassomDias: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button 
            type="submit" 
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {(createMutation.isPending || updateMutation.isPending) ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </form>
    </div>
  );
}
