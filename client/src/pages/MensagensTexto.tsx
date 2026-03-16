import { useState, useMemo, useRef, useCallback } from 'react';
import TemplateWizard from '@/components/TemplateWizard';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  MessageSquare,
  Plus,
  Trash2,
  Edit,
  Send,
  FileText,
  Clock,
  Zap,
  Settings,
  Upload,
  X,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
} from 'lucide-react';

const GATILHO_LABELS: Record<string, string> = {
  idade_gestacional: 'Idade Gestacional',
  evento: 'Evento',
  manual: 'Manual',
};

const EVENTO_LABELS: Record<string, string> = {
  pos_cesarea: 'Pós-Cesárea',
  pos_parto_normal: 'Pós-Parto Normal',
  cadastro_gestante: 'Cadastro de Gestante',
  primeira_consulta: 'Primeira Consulta',
};

const STATUS_CONFIG: Record<string, { label: string; icon: typeof CheckCircle; color: string }> = {
  enviado: { label: 'Enviado', icon: CheckCircle, color: 'text-green-600' },
  falhou: { label: 'Falhou', icon: XCircle, color: 'text-red-600' },
  pendente: { label: 'Pendente', icon: AlertCircle, color: 'text-yellow-600' },
};

interface TemplateForm {
  nome: string;
  mensagem: string;
  gatilhoTipo: 'idade_gestacional' | 'evento' | 'manual';
  igSemanas?: number;
  igDias?: number;
  evento?: string;
  pdfUrl?: string;
  pdfKey?: string;
  pdfNome?: string;
  condicaoRhNegativo?: boolean;
}

const emptyForm: TemplateForm = {
  nome: '',
  mensagem: '',
  gatilhoTipo: 'manual',
  condicaoRhNegativo: false,
};

export default function MensagensTexto() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const utils = trpc.useUtils();

  const [activeTab, setActiveTab] = useState('templates');
  const [showDialog, setShowDialog] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<TemplateForm>(emptyForm);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewMessage, setPreviewMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Queries
  const { data: templates, isLoading: loadingTemplates } = trpc.whatsapp.listarTemplates.useQuery();
  const { data: historico, isLoading: loadingHistorico } = trpc.whatsapp.historico.useQuery({ limit: 100 });
  const { data: config } = trpc.whatsapp.getConfig.useQuery(undefined, { enabled: isAdmin });

  // Mutations
  const criarMutation = trpc.whatsapp.criarTemplate.useMutation({
    onSuccess: () => {
      toast.success('Template criado com sucesso!');
      setShowDialog(false);
      setShowWizard(false);
      setForm(emptyForm);
      utils.whatsapp.listarTemplates.invalidate();
    },
    onError: (err) => toast.error(`Erro: ${err.message}`),
  });

  const atualizarMutation = trpc.whatsapp.atualizarTemplate.useMutation({
    onSuccess: () => {
      toast.success('Template atualizado!');
      setShowDialog(false);
      setForm(emptyForm);
      setEditingId(null);
      utils.whatsapp.listarTemplates.invalidate();
    },
    onError: (err) => toast.error(`Erro: ${err.message}`),
  });

  const deletarMutation = trpc.whatsapp.deletarTemplate.useMutation({
    onSuccess: () => {
      toast.success('Template removido.');
      utils.whatsapp.listarTemplates.invalidate();
    },
    onError: (err) => toast.error(`Erro: ${err.message}`),
  });

  const toggleMutation = trpc.whatsapp.toggleTemplate.useMutation({
    onSuccess: () => utils.whatsapp.listarTemplates.invalidate(),
    onError: (err) => toast.error(`Erro: ${err.message}`),
  });

  const uploadPdfMutation = trpc.whatsapp.uploadPdf.useMutation({
    onSuccess: (data) => {
      setForm(prev => ({ ...prev, pdfUrl: data.url, pdfKey: data.key }));
      setUploadingPdf(false);
      toast.success('PDF enviado com sucesso!');
    },
    onError: (err) => {
      setUploadingPdf(false);
      toast.error(`Erro ao enviar PDF: ${err.message}`);
    },
  });

  // Config mutations (admin only)
  const [configForm, setConfigForm] = useState({ apiKey: '', ativo: 0 });
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [testPhone, setTestPhone] = useState('');

  const salvarConfigMutation = trpc.whatsapp.salvarConfig.useMutation({
    onSuccess: () => {
      toast.success('Configuração salva!');
      setShowConfigDialog(false);
      utils.whatsapp.getConfig.invalidate();
    },
    onError: (err) => toast.error(`Erro: ${err.message}`),
  });

  const testarEnvioMutation = trpc.whatsapp.testarEnvio.useMutation({
    onSuccess: () => toast.success('Mensagem de teste enviada!'),
    onError: (err) => toast.error(`Erro: ${err.message}`),
  });

  // Grouped templates
  const groupedTemplates = useMemo(() => {
    if (!templates) return { idade_gestacional: [], evento: [], manual: [] };
    const groups: Record<string, typeof templates> = { idade_gestacional: [], evento: [], manual: [] };
    templates.forEach(t => {
      (groups[t.gatilhoTipo] || groups.manual).push(t);
    });
    // Sort IG templates by week
    groups.idade_gestacional.sort((a, b) => (a.igSemanas || 0) - (b.igSemanas || 0));
    return groups;
  }, [templates]);

  const handleOpenCreate = () => {
    setShowWizard(true);
  };

  const handleWizardSave = useCallback((data: {
    nome: string;
    mensagem: string;
    gatilhoTipo: 'idade_gestacional' | 'evento' | 'manual';
    igSemanas?: number;
    igDias?: number;
    evento?: string;
    pdfUrl?: string;
    pdfKey?: string;
    pdfNome?: string;
    condicaoRhNegativo?: number;
  }) => {
    criarMutation.mutate({
      ...data,
      evento: data.evento as 'pos_cesarea' | 'pos_parto_normal' | 'cadastro_gestante' | 'primeira_consulta' | undefined,
    });
  }, [criarMutation]);

  const handleWizardUploadPdf = useCallback(async (file: File): Promise<{ url: string; key: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        uploadPdfMutation.mutate(
          { fileName: file.name, fileBase64: base64 },
          {
            onSuccess: (data) => resolve({ url: data.url, key: data.key }),
            onError: (err) => reject(err),
          }
        );
      };
      reader.readAsDataURL(file);
    });
  }, [uploadPdfMutation]);

  const handleOpenEdit = (template: NonNullable<typeof templates>[0]) => {
    setEditingId(template.id);
    setForm({
      nome: template.nome,
      mensagem: template.mensagem,
      gatilhoTipo: template.gatilhoTipo as TemplateForm['gatilhoTipo'],
      igSemanas: template.igSemanas || undefined,
      igDias: template.igDias || undefined,
      evento: template.evento || undefined,
      pdfUrl: template.pdfUrl || undefined,
      pdfKey: template.pdfKey || undefined,
      pdfNome: template.pdfNome || undefined,
      condicaoRhNegativo: template.condicaoRhNegativo === 1,
    });
    setShowDialog(true);
  };

  const handleSave = () => {
    if (!form.nome.trim() || !form.mensagem.trim()) {
      toast.error('Preencha nome e mensagem.');
      return;
    }
    if (form.gatilhoTipo === 'idade_gestacional' && !form.igSemanas) {
      toast.error('Informe a semana gestacional para o gatilho.');
      return;
    }
    if (form.gatilhoTipo === 'evento' && !form.evento) {
      toast.error('Selecione o evento gatilho.');
      return;
    }

    const payload = {
      nome: form.nome.trim(),
      mensagem: form.mensagem.trim(),
      gatilhoTipo: form.gatilhoTipo,
      igSemanas: form.gatilhoTipo === 'idade_gestacional' ? form.igSemanas : undefined,
      igDias: form.gatilhoTipo === 'idade_gestacional' ? (form.igDias || 0) : undefined,
      evento: form.gatilhoTipo === 'evento' ? form.evento as any : undefined,
      pdfUrl: form.pdfUrl,
      pdfKey: form.pdfKey,
      pdfNome: form.pdfNome,
      condicaoRhNegativo: form.condicaoRhNegativo ? 1 : 0,
    };

    if (editingId) {
      atualizarMutation.mutate({ id: editingId, ...payload });
    } else {
      criarMutation.mutate(payload);
    }
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      toast.error('Apenas arquivos PDF são aceitos.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo: 10MB.');
      return;
    }

    setUploadingPdf(true);
    setForm(prev => ({ ...prev, pdfNome: file.name }));

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      uploadPdfMutation.mutate({ fileName: file.name, fileBase64: base64 });
    };
    reader.readAsDataURL(file);
  };

  const handlePreview = (mensagem: string) => {
    // Replace variables with example data
    let preview = mensagem;
    preview = preview.replace(/\{nome\}/g, 'Maria Silva');
    preview = preview.replace(/\{ig_semanas\}/g, '28');
    preview = preview.replace(/\{ig_dias\}/g, '3');
    preview = preview.replace(/\{dpp\}/g, '15/06/2026');
    preview = preview.replace(/\{medico\}/g, 'Dr. João');
    preview = preview.replace(/\{telefone_medico\}/g, '(35) 99999-0000');
    setPreviewMessage(preview);
    setShowPreview(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="h-6 w-6" />
            Mensagens de Texto
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure mensagens automáticas via WhatsApp para suas gestantes
          </p>
        </div>
        {isAdmin && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setConfigForm({
                apiKey: config?.apiKey || '',
                ativo: config?.ativo ?? 0,
              });
              setShowConfigDialog(true);
            }}
            className="gap-2"
          >
            <Settings className="h-4 w-4" />
            Configurar WhatsApp
          </Button>
        )}
      </div>

      {/* Status da integração */}
      {isAdmin && (
        <Card className={config?.ativo ? 'border-green-200 bg-green-50/50' : 'border-yellow-200 bg-yellow-50/50'}>
          <CardContent className="py-3 flex items-center gap-3">
            {config?.ativo ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm text-green-800">WhatsApp integrado e ativo</span>
              </>
            ) : (
              <>
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <span className="text-sm text-yellow-800">
                  WhatsApp não configurado. Clique em "Configurar WhatsApp" para ativar.
                </span>
              </>
            )}
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="templates" className="gap-2">
            <FileText className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="historico" className="gap-2">
            <Clock className="h-4 w-4" />
            Histórico
          </TabsTrigger>
        </TabsList>

        {/* ─── Templates Tab ─── */}
        <TabsContent value="templates" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={handleOpenCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Template
            </Button>
          </div>

          {loadingTemplates ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : !templates?.length ? (
            <Card>
              <CardContent className="py-12 text-center">
                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">Nenhum template configurado.</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Crie templates para enviar mensagens automáticas por idade gestacional ou evento.
                </p>
                <Button onClick={handleOpenCreate} className="mt-4 gap-2">
                  <Plus className="h-4 w-4" />
                  Criar Primeiro Template
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Por Idade Gestacional */}
              {groupedTemplates.idade_gestacional.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Por Idade Gestacional
                  </h3>
                  <div className="space-y-2">
                    {groupedTemplates.idade_gestacional.map(t => (
                      <TemplateCard
                        key={t.id}
                        template={t}
                        onEdit={() => handleOpenEdit(t)}
                        onDelete={() => deletarMutation.mutate({ id: t.id })}
                        onToggle={(ativo) => toggleMutation.mutate({ id: t.id, ativo })}
                        onPreview={() => handlePreview(t.mensagem)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Por Evento */}
              {groupedTemplates.evento.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Por Evento
                  </h3>
                  <div className="space-y-2">
                    {groupedTemplates.evento.map(t => (
                      <TemplateCard
                        key={t.id}
                        template={t}
                        onEdit={() => handleOpenEdit(t)}
                        onDelete={() => deletarMutation.mutate({ id: t.id })}
                        onToggle={(ativo) => toggleMutation.mutate({ id: t.id, ativo })}
                        onPreview={() => handlePreview(t.mensagem)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Manual */}
              {groupedTemplates.manual.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                    <Send className="h-4 w-4" />
                    Envio Manual
                  </h3>
                  <div className="space-y-2">
                    {groupedTemplates.manual.map(t => (
                      <TemplateCard
                        key={t.id}
                        template={t}
                        onEdit={() => handleOpenEdit(t)}
                        onDelete={() => deletarMutation.mutate({ id: t.id })}
                        onToggle={(ativo) => toggleMutation.mutate({ id: t.id, ativo })}
                        onPreview={() => handlePreview(t.mensagem)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Variáveis disponíveis */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Variáveis Disponíveis</CardTitle>
              <CardDescription>Use estas variáveis no texto da mensagem. Serão substituídas pelos dados da gestante.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {[
                  { var: '{nome}', desc: 'Nome da gestante' },
                  { var: '{ig_semanas}', desc: 'Semanas de IG' },
                  { var: '{ig_dias}', desc: 'Dias de IG' },
                  { var: '{dpp}', desc: 'Data provável do parto' },
                  { var: '{medico}', desc: 'Nome do médico' },
                  { var: '{telefone_medico}', desc: 'Telefone do médico' },
                ].map(v => (
                  <Badge key={v.var} variant="secondary" className="cursor-help" title={v.desc}>
                    {v.var} <span className="ml-1 text-xs opacity-60">({v.desc})</span>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Histórico Tab ─── */}
        <TabsContent value="historico">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Histórico de Mensagens Enviadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingHistorico ? (
                <p className="text-sm text-muted-foreground">Carregando...</p>
              ) : !historico?.length ? (
                <p className="text-sm text-muted-foreground">Nenhuma mensagem enviada ainda.</p>
              ) : (
                <div className="space-y-3">
                  {historico.map(h => {
                    const statusInfo = STATUS_CONFIG[h.status] || STATUS_CONFIG.pendente;
                    const StatusIcon = statusInfo.icon;
                    return (
                      <div key={h.id} className="flex items-start gap-3 border-b pb-3 last:border-0">
                        <StatusIcon className={`h-5 w-5 mt-0.5 shrink-0 ${statusInfo.color}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {h.nomeGestante && (
                              <span className="font-medium text-sm">{h.nomeGestante}</span>
                            )}
                            <span className="text-xs text-muted-foreground">{h.telefone}</span>
                            <Badge variant={h.status === 'enviado' ? 'default' : 'destructive'} className="text-xs">
                              {statusInfo.label}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">{h.mensagem}</p>
                          {h.pdfUrl && (
                            <Badge variant="outline" className="mt-1 text-xs gap-1">
                              <FileText className="h-3 w-3" /> PDF anexo
                            </Badge>
                          )}
                          {h.erroMensagem && (
                            <p className="text-xs text-destructive mt-1">{h.erroMensagem}</p>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(h.sentAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ─── Wizard: Novo Template ─── */}
      <TemplateWizard
        open={showWizard}
        onOpenChange={setShowWizard}
        onSave={handleWizardSave}
        onUploadPdf={handleWizardUploadPdf}
        isSaving={criarMutation.isPending}
        uploadingPdf={uploadingPdf}
      />

      {/* ─── Dialog: Editar Template ─── */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Template' : 'Novo Template de Mensagem'}</DialogTitle>
            <DialogDescription>
              Configure a mensagem e o gatilho de envio automático.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Nome do Template</Label>
              <Input
                placeholder="Ex: Lembrete Vacina DTPa"
                value={form.nome}
                onChange={e => setForm(prev => ({ ...prev, nome: e.target.value }))}
              />
            </div>

            <div>
              <Label>Tipo de Gatilho</Label>
              <Select
                value={form.gatilhoTipo}
                onValueChange={(v) => setForm(prev => ({ ...prev, gatilhoTipo: v as TemplateForm['gatilhoTipo'] }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="idade_gestacional">Por Idade Gestacional</SelectItem>
                  <SelectItem value="evento">Por Evento</SelectItem>
                  <SelectItem value="manual">Envio Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {form.gatilhoTipo === 'idade_gestacional' && (
              <div className="flex gap-3">
                <div className="flex-1">
                  <Label>Semana</Label>
                  <Input
                    type="number"
                    min={1}
                    max={45}
                    placeholder="Ex: 28"
                    value={form.igSemanas || ''}
                    onChange={e => setForm(prev => ({ ...prev, igSemanas: parseInt(e.target.value) || undefined }))}
                  />
                </div>
                <div className="w-24">
                  <Label>Dias</Label>
                  <Input
                    type="number"
                    min={0}
                    max={6}
                    placeholder="0"
                    value={form.igDias || ''}
                    onChange={e => setForm(prev => ({ ...prev, igDias: parseInt(e.target.value) || 0 }))}
                  />
                </div>
              </div>
            )}

            {form.gatilhoTipo === 'evento' && (
              <div>
                <Label>Evento</Label>
                <Select
                  value={form.evento || ''}
                  onValueChange={(v) => setForm(prev => ({ ...prev, evento: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o evento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pos_cesarea">Pós-Cesárea</SelectItem>
                    <SelectItem value="pos_parto_normal">Pós-Parto Normal</SelectItem>
                    <SelectItem value="cadastro_gestante">Cadastro de Gestante</SelectItem>
                    <SelectItem value="primeira_consulta">Primeira Consulta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label>Mensagem</Label>
              <Textarea
                placeholder="Olá {nome}! Você está com {ig_semanas} semanas de gestação..."
                value={form.mensagem}
                onChange={e => setForm(prev => ({ ...prev, mensagem: e.target.value }))}
                rows={5}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Use variáveis: {'{nome}'}, {'{ig_semanas}'}, {'{ig_dias}'}, {'{dpp}'}, {'{medico}'}, {'{telefone_medico}'}
              </p>
            </div>

            {/* Condição: Apenas Rh Negativo */}
            {form.gatilhoTipo === 'idade_gestacional' && (
              <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                <input
                  type="checkbox"
                  id="condicaoRhNegativo"
                  checked={form.condicaoRhNegativo || false}
                  onChange={e => setForm(prev => ({ ...prev, condicaoRhNegativo: e.target.checked }))}
                  className="h-4 w-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                />
                <label htmlFor="condicaoRhNegativo" className="text-sm font-medium text-amber-800 dark:text-amber-200 cursor-pointer">
                  Enviar apenas para gestantes com Rh negativo
                </label>
              </div>
            )}

            {/* PDF Upload */}
            <div>
              <Label>PDF Anexo (opcional)</Label>
              <div className="mt-1">
                {form.pdfUrl ? (
                  <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                    <FileText className="h-4 w-4 text-red-500" />
                    <span className="text-sm flex-1 truncate">{form.pdfNome || 'Documento.pdf'}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => setForm(prev => ({ ...prev, pdfUrl: undefined, pdfKey: undefined, pdfNome: undefined }))}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={handlePdfUpload}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingPdf}
                      className="gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      {uploadingPdf ? 'Enviando...' : 'Anexar PDF'}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-1">Máximo: 10MB</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => handlePreview(form.mensagem)} disabled={!form.mensagem}>
              <Eye className="h-4 w-4 mr-2" />
              Pré-visualizar
            </Button>
            <Button
              onClick={handleSave}
              disabled={criarMutation.isPending || atualizarMutation.isPending}
            >
              {editingId ? 'Salvar Alterações' : 'Criar Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Dialog: Preview ─── */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Pré-visualização da Mensagem</DialogTitle>
            <DialogDescription>Exemplo com dados fictícios</DialogDescription>
          </DialogHeader>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm whitespace-pre-wrap">{previewMessage}</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Dialog: Config WhatsApp (admin only) ─── */}
      <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Configuração WhatsApp</DialogTitle>
            <DialogDescription>
              Configure o token da API WaSenderAPI para habilitar o envio de mensagens.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Token WaSenderAPI</Label>
              <Input
                type="password"
                placeholder="Cole seu token aqui"
                value={configForm.apiKey}
                onChange={e => setConfigForm(prev => ({ ...prev, apiKey: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Obtenha em <a href="https://www.wasenderapi.com" target="_blank" rel="noopener" className="underline">wasenderapi.com</a>
              </p>
            </div>

            <div className="flex items-center justify-between">
              <Label>WhatsApp Ativo</Label>
              <Switch
                checked={configForm.ativo === 1}
                onCheckedChange={(checked) => setConfigForm(prev => ({ ...prev, ativo: checked ? 1 : 0 }))}
              />
            </div>

            <div className="border-t pt-4">
              <Label>Testar Envio</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  placeholder="5535999887766"
                  value={testPhone}
                  onChange={e => setTestPhone(e.target.value.replace(/\D/g, ''))}
                  maxLength={15}
                />
                <Button
                  variant="outline"
                  onClick={() => {
                    if (!testPhone || testPhone.length < 10) {
                      toast.error('Informe um número válido.');
                      return;
                    }
                    testarEnvioMutation.mutate({ telefone: testPhone });
                  }}
                  disabled={testarEnvioMutation.isPending}
                  className="gap-2 shrink-0"
                >
                  <Send className="h-4 w-4" />
                  Testar
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => {
                if (!configForm.apiKey.trim()) {
                  toast.error('Informe o token da API.');
                  return;
                }
                salvarConfigMutation.mutate(configForm);
              }}
              disabled={salvarConfigMutation.isPending}
            >
              Salvar Configuração
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Template Card Component ─────────────────────────────────────────────────

function TemplateCard({
  template,
  onEdit,
  onDelete,
  onToggle,
  onPreview,
}: {
  template: {
    id: number;
    nome: string;
    mensagem: string;
    gatilhoTipo: string;
    igSemanas: number | null;
    igDias: number | null;
    evento: string | null;
    pdfUrl: string | null;
    pdfNome: string | null;
    condicaoRhNegativo: number | null;
    ativo: number;
  };
  onEdit: () => void;
  onDelete: () => void;
  onToggle: (ativo: number) => void;
  onPreview: () => void;
}) {
  return (
    <Card className={template.ativo ? '' : 'opacity-60'}>
      <CardContent className="py-3 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm">{template.nome}</span>
            <Badge variant="outline" className="text-xs">
              {GATILHO_LABELS[template.gatilhoTipo] || template.gatilhoTipo}
            </Badge>
            {template.gatilhoTipo === 'idade_gestacional' && template.igSemanas && (
              <Badge variant="secondary" className="text-xs">
                {template.igSemanas}s{template.igDias ? `+${template.igDias}d` : ''}
              </Badge>
            )}
            {template.gatilhoTipo === 'evento' && template.evento && (
              <Badge variant="secondary" className="text-xs">
                {EVENTO_LABELS[template.evento] || template.evento}
              </Badge>
            )}
            {template.pdfUrl && (
              <Badge variant="outline" className="text-xs gap-1">
                <FileText className="h-3 w-3" />
                {template.pdfNome || 'PDF'}
              </Badge>
            )}
            {template.condicaoRhNegativo === 1 && (
              <Badge variant="outline" className="text-xs gap-1 border-amber-400 text-amber-700 bg-amber-50">
                Rh-
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground line-clamp-1">{template.mensagem}</p>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onPreview} title="Pré-visualizar">
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit} title="Editar">
            <Edit className="h-4 w-4" />
          </Button>
          <Switch
            checked={template.ativo === 1}
            onCheckedChange={(checked) => onToggle(checked ? 1 : 0)}
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={onDelete}
            title="Remover"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
