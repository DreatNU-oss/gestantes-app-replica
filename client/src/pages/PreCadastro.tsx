import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/PhoneInput";
import { EmailInput } from "@/components/EmailInput";
import { DateOfBirthInput } from "@/components/DateOfBirthInput";
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
import {
  ArrowLeft,
  UserPlus,
  Pencil,
  Search,
  AlertTriangle,
  Scale,
  Check,
} from "lucide-react";
import { useLocation } from "wouter";
import GestantesLayout from "@/components/GestantesLayout";
import { useGestanteAtiva } from "@/contexts/GestanteAtivaContext";

interface PreCadastroFormData {
  nome: string;
  dataNascimento: string;
  telefone: string;
  email: string;
  planoSaudeId: string;
  altura: string;
  pesoInicial: string;
}

const EMPTY_FORM: PreCadastroFormData = {
  nome: "",
  dataNascimento: "",
  telefone: "",
  email: "",
  planoSaudeId: "",
  altura: "",
  pesoInicial: "",
};

export default function PreCadastro() {
  const [, setLocation] = useLocation();
  const { setGestanteAtiva } = useGestanteAtiva();
  const [mode, setMode] = useState<"list" | "add" | "edit">("list");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState<PreCadastroFormData>({ ...EMPTY_FORM });
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof PreCadastroFormData, string>>>({});

  const { data: gestantes, isLoading, refetch } = trpc.gestantes.list.useQuery(
    { searchTerm: "", sortBy: "nome" },
    { staleTime: 30000 }
  );

  const { data: planos = [] } = trpc.planosSaude.listar.useQuery();

  const filteredGestantes = useMemo(() => {
    if (!gestantes) return [];
    if (!searchTerm) return gestantes;
    const term = searchTerm.toLowerCase();
    return gestantes.filter(g =>
      g.nome.toLowerCase().includes(term) ||
      g.telefone?.toLowerCase().includes(term) ||
      g.email?.toLowerCase().includes(term)
    );
  }, [gestantes, searchTerm]);

  const createMutation = trpc.gestantes.create.useMutation({
    onSuccess: (data) => {
      toast.success("Pré-cadastro realizado com sucesso!", {
        description: "Redirecionando para a pré-consulta...",
        duration: 3000,
      });
      refetch();
      // Definir a gestante recém-criada como ativa e redirecionar para pré-consulta
      if (data && (data as any).id) {
        setGestanteAtiva({ id: (data as any).id, nome: (data as any).nome || formData.nome });
        setFormData({ ...EMPTY_FORM });
        setFieldErrors({});
        setMode("list");
        setEditingId(null);
        // Redirecionar para página de pré-consulta
        setLocation("/pre-consulta");
      } else {
        resetForm();
      }
    },
    onError: (error) => {
      toast.error("Erro ao salvar", { description: error.message });
    },
  });

  const updateMutation = trpc.gestantes.update.useMutation({
    onSuccess: () => {
      toast.success("Dados atualizados com sucesso!");
      refetch();
      resetForm();
    },
    onError: (error) => {
      toast.error("Erro ao atualizar", { description: error.message });
    },
  });

  const resetForm = () => {
    setFormData({ ...EMPTY_FORM });
    setFieldErrors({});
    setMode("list");
    setEditingId(null);
  };

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof PreCadastroFormData, string>> = {};

    if (!formData.nome || formData.nome.trim() === "") {
      errors.nome = "Nome completo é obrigatório";
    }
    if (!formData.dataNascimento) {
      errors.dataNascimento = "Data de nascimento é obrigatória";
    }
    if (!formData.telefone || formData.telefone.trim() === "") {
      errors.telefone = "Telefone é obrigatório";
    }
    if (!formData.email || formData.email.trim() === "") {
      errors.email = "E-mail é obrigatório";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "E-mail inválido";
    }
    if (!formData.planoSaudeId) {
      errors.planoSaudeId = "Plano de saúde é obrigatório";
    }
    if (!formData.altura || formData.altura.trim() === "") {
      errors.altura = "Altura é obrigatória";
    }
    if (!formData.pesoInicial || formData.pesoInicial.trim() === "") {
      errors.pesoInicial = "Peso ao engravidar é obrigatório";
    }

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      toast.error("Preencha todos os campos obrigatórios", {
        description: "Todos os campos são obrigatórios no pré-cadastro.",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const data: any = {
      nome: formData.nome,
      telefone: formData.telefone,
      email: formData.email,
      dataNascimento: formData.dataNascimento,
      planoSaudeId: formData.planoSaudeId ? parseInt(formData.planoSaudeId) : undefined,
      altura: formData.altura ? parseInt(formData.altura) : undefined,
      pesoInicial: formData.pesoInicial ? Math.round(parseFloat(formData.pesoInicial) * 1000) : undefined,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (gestante: any) => {
    setEditingId(gestante.id);
    setFormData({
      nome: gestante.nome || "",
      dataNascimento: gestante.dataNascimento
        ? typeof gestante.dataNascimento === "string"
          ? gestante.dataNascimento
          : (gestante.dataNascimento as Date).toISOString().split("T")[0]
        : "",
      telefone: gestante.telefone || "",
      email: gestante.email || "",
      planoSaudeId: gestante.planoSaudeId?.toString() || "",
      altura: gestante.altura?.toString() || "",
      pesoInicial: gestante.pesoInicial ? (gestante.pesoInicial / 1000).toFixed(1) : "",
    });
    setFieldErrors({});
    setMode("edit");
  };

  const clearFieldError = (field: keyof PreCadastroFormData) => {
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // Form view (add or edit)
  if (mode === "add" || mode === "edit") {
    return (
      <GestantesLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={resetForm}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                {mode === "add" ? "Novo Pré-Cadastro" : "Editar Pré-Cadastro"}
              </h2>
              <p className="text-sm text-muted-foreground">
                Preencha todos os campos abaixo. Todos são obrigatórios.
              </p>
            </div>
          </div>

          {/* ALERTA PESO - Muito evidente */}
          <div className="rounded-lg border-2 border-amber-500 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-amber-500 p-2 shrink-0">
                <Scale className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-amber-800 text-lg flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  ATENÇÃO: Peso ao Engravidar
                </h3>
                <p className="text-amber-700 mt-1 font-medium">
                  O campo "Peso ao engravidar" deve conter o <strong>peso da paciente QUANDO ENGRAVIDOU</strong>,
                  e <strong>NÃO o peso de hoje</strong>. Este valor é usado para cálculo do IMC pré-gestacional
                  e acompanhamento do ganho de peso durante a gestação.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader>
                <CardTitle>Dados da Gestante</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Nome Completo */}
                <div className="space-y-2">
                  <Label htmlFor="nome">
                    Nome Completo <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => {
                      setFormData({ ...formData, nome: e.target.value });
                      clearFieldError("nome");
                    }}
                    placeholder="Nome completo da gestante"
                    className={fieldErrors.nome ? "border-red-500 focus-visible:ring-red-500" : ""}
                  />
                  {fieldErrors.nome && <p className="text-sm text-red-500">{fieldErrors.nome}</p>}
                </div>

                {/* Data de Nascimento */}
                <div className="space-y-2">
                  <Label htmlFor="dataNascimento">
                    Data de Nascimento <span className="text-red-500">*</span>
                  </Label>
                  <DateOfBirthInput
                    id="dataNascimento"
                    value={formData.dataNascimento}
                    onChange={(value) => {
                      setFormData({ ...formData, dataNascimento: value });
                      clearFieldError("dataNascimento");
                    }}
                    className={fieldErrors.dataNascimento ? "border-red-500 focus-visible:ring-red-500" : ""}
                  />
                  {fieldErrors.dataNascimento && (
                    <p className="text-sm text-red-500">{fieldErrors.dataNascimento}</p>
                  )}
                </div>

                {/* Telefone */}
                <div className="space-y-2">
                  <Label htmlFor="telefone">
                    Telefone <span className="text-red-500">*</span>
                  </Label>
                  <PhoneInput
                    id="telefone"
                    value={formData.telefone}
                    onChange={(value) => {
                      setFormData({ ...formData, telefone: value });
                      clearFieldError("telefone");
                    }}
                    className={fieldErrors.telefone ? "border-red-500 focus-visible:ring-red-500" : ""}
                  />
                  {fieldErrors.telefone && <p className="text-sm text-red-500">{fieldErrors.telefone}</p>}
                </div>

                {/* E-mail */}
                <div className="space-y-2">
                  <Label htmlFor="email">
                    E-mail <span className="text-red-500">*</span>
                  </Label>
                  <EmailInput
                    id="email"
                    value={formData.email}
                    onChange={(value) => {
                      setFormData({ ...formData, email: value });
                      clearFieldError("email");
                    }}
                    className={fieldErrors.email ? "border-red-500 focus-visible:ring-red-500" : ""}
                  />
                  {fieldErrors.email && <p className="text-sm text-red-500">{fieldErrors.email}</p>}
                </div>

                {/* Plano de Saúde */}
                <div className="space-y-2">
                  <Label htmlFor="planoSaude">
                    Plano de Saúde <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.planoSaudeId}
                    onValueChange={(value) => {
                      setFormData({ ...formData, planoSaudeId: value });
                      clearFieldError("planoSaudeId");
                    }}
                  >
                    <SelectTrigger
                      className={fieldErrors.planoSaudeId ? "border-red-500 focus-visible:ring-red-500" : ""}
                    >
                      <SelectValue placeholder="Selecione o plano de saúde" />
                    </SelectTrigger>
                    <SelectContent>
                      {planos.map((p: any) => (
                        <SelectItem key={p.id} value={p.id.toString()}>
                          {p.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldErrors.planoSaudeId && (
                    <p className="text-sm text-red-500">{fieldErrors.planoSaudeId}</p>
                  )}
                </div>

                {/* Altura e Peso */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="altura">
                      Altura (cm) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="altura"
                      type="number"
                      min="100"
                      max="250"
                      placeholder="Ex: 165"
                      value={formData.altura}
                      onChange={(e) => {
                        setFormData({ ...formData, altura: e.target.value });
                        clearFieldError("altura");
                      }}
                      className={fieldErrors.altura ? "border-red-500 focus-visible:ring-red-500" : ""}
                    />
                    {fieldErrors.altura && <p className="text-sm text-red-500">{fieldErrors.altura}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pesoInicial" className="flex items-center gap-2">
                      <span>
                        Peso ao Engravidar (kg) <span className="text-red-500">*</span>
                      </span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="pesoInicial"
                        type="text"
                        inputMode="decimal"
                        placeholder="Ex: 65.5"
                        value={formData.pesoInicial}
                        onChange={(e) => {
                          const v = e.target.value.replace(",", ".");
                          if (v === "" || /^\d{0,3}(\.\d{0,1})?$/.test(v)) {
                            setFormData({ ...formData, pesoInicial: v });
                            clearFieldError("pesoInicial");
                          }
                        }}
                        className={`${fieldErrors.pesoInicial ? "border-red-500 focus-visible:ring-red-500" : "border-amber-400"} bg-amber-50/50`}
                      />
                    </div>
                    {fieldErrors.pesoInicial && (
                      <p className="text-sm text-red-500">{fieldErrors.pesoInicial}</p>
                    )}
                    <p className="text-xs text-amber-600 font-semibold flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Peso QUANDO ENGRAVIDOU, não o peso atual!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-3 mt-6">
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="bg-primary"
              >
                {createMutation.isPending || updateMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Salvando...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Check className="h-4 w-4" />
                    {mode === "add" ? "Salvar Pré-Cadastro" : "Atualizar Dados"}
                  </span>
                )}
              </Button>
            </div>
          </form>
        </div>
      </GestantesLayout>
    );
  }

  // List view
  return (
    <GestantesLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-foreground">Pré-Cadastro de Gestantes</h2>
            <p className="text-sm text-muted-foreground">
              Cadastre os dados básicos das pacientes para agilizar o atendimento médico.
            </p>
          </div>
          <Button onClick={() => setMode("add")} className="gap-2">
            <UserPlus className="h-4 w-4" />
            Nova Gestante
          </Button>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, telefone ou e-mail..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* List */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">Carregando...</div>
            ) : filteredGestantes.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-muted-foreground">
                  {searchTerm ? "Nenhuma gestante encontrada para esta busca." : "Nenhuma gestante cadastrada."}
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredGestantes.map((g) => {
                  const missingFields: string[] = [];
                  if (!g.telefone) missingFields.push("Telefone");
                  if (!g.email) missingFields.push("E-mail");
                  if (!g.altura) missingFields.push("Altura");
                  if (!g.pesoInicial) missingFields.push("Peso");
                  if (!g.dataNascimento) missingFields.push("Data Nasc.");
                  if (!g.planoSaudeId) missingFields.push("Plano");

                  return (
                    <div
                      key={g.id}
                      className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="space-y-1">
                        <p className="font-medium">{g.nome}</p>
                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                          {g.telefone && <span>{g.telefone}</span>}
                          {g.email && <span>• {g.email}</span>}
                        </div>
                        {missingFields.length > 0 && (
                          <div className="flex items-center gap-1 text-xs text-amber-600">
                            <AlertTriangle className="h-3 w-3" />
                            <span>Faltam: {missingFields.join(", ")}</span>
                          </div>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(g)}
                        className="gap-1"
                      >
                        <Pencil className="h-3 w-3" />
                        Editar
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </GestantesLayout>
  );
}
