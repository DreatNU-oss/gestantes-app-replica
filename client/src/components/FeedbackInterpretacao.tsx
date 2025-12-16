import { useState } from 'react';
import { Star, MessageSquare, CheckCircle, XCircle, AlertCircle, Send, ThumbsUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

interface FeedbackInterpretacaoProps {
  historicoInterpretacaoId: number;
  gestanteId: number;
  tipoInterpretacao: 'exames_laboratoriais' | 'ultrassom';
  onFeedbackEnviado?: () => void;
}

export function FeedbackInterpretacao({
  historicoInterpretacaoId,
  gestanteId,
  tipoInterpretacao,
  onFeedbackEnviado,
}: FeedbackInterpretacaoProps) {
  const [open, setOpen] = useState(false);
  const [avaliacao, setAvaliacao] = useState(0);
  const [hoverAvaliacao, setHoverAvaliacao] = useState(0);
  const [precisaoData, setPrecisaoData] = useState<'correta' | 'incorreta' | 'nao_extraiu' | undefined>();
  const [precisaoValores, setPrecisaoValores] = useState<'todos_corretos' | 'alguns_incorretos' | 'maioria_incorreta' | undefined>();
  const [comentario, setComentario] = useState('');

  const utils = trpc.useUtils();
  
  // Verificar se já existe feedback
  const { data: feedbackExistente } = trpc.feedback.buscarPorHistorico.useQuery(
    { historicoInterpretacaoId },
    { enabled: historicoInterpretacaoId > 0 }
  );

  const criarFeedback = trpc.feedback.criar.useMutation({
    onSuccess: () => {
      toast.success('Feedback enviado com sucesso!', {
        description: 'Obrigado por ajudar a melhorar a precisão da IA.',
      });
      setOpen(false);
      utils.feedback.buscarPorHistorico.invalidate({ historicoInterpretacaoId });
      onFeedbackEnviado?.();
    },
    onError: (error) => {
      toast.error('Erro ao enviar feedback', {
        description: error.message,
      });
    },
  });

  const handleSubmit = () => {
    if (avaliacao === 0) {
      toast.error('Por favor, selecione uma avaliação');
      return;
    }

    criarFeedback.mutate({
      historicoInterpretacaoId,
      gestanteId,
      tipoInterpretacao,
      avaliacao,
      precisaoData,
      precisaoValores,
      comentario: comentario || undefined,
    });
  };

  // Se já existe feedback, mostrar resumo
  if (feedbackExistente) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <ThumbsUp className="h-4 w-4 text-green-500" />
        <span>Avaliado: {feedbackExistente.avaliacao}/5 estrelas</span>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <MessageSquare className="h-4 w-4" />
          Avaliar Precisão
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Avaliar Interpretação da IA</DialogTitle>
          <DialogDescription>
            Seu feedback ajuda a melhorar a precisão das interpretações automáticas.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Avaliação por estrelas */}
          <div className="space-y-2">
            <Label>Avaliação Geral</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setAvaliacao(star)}
                  onMouseEnter={() => setHoverAvaliacao(star)}
                  onMouseLeave={() => setHoverAvaliacao(0)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= (hoverAvaliacao || avaliacao)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              {avaliacao === 0 && 'Clique para avaliar'}
              {avaliacao === 1 && 'Muito impreciso'}
              {avaliacao === 2 && 'Impreciso'}
              {avaliacao === 3 && 'Razoável'}
              {avaliacao === 4 && 'Preciso'}
              {avaliacao === 5 && 'Muito preciso'}
            </p>
          </div>

          {/* Precisão da data */}
          <div className="space-y-2">
            <Label>A data do exame foi extraída corretamente?</Label>
            <RadioGroup
              value={precisaoData}
              onValueChange={(value) => setPrecisaoData(value as typeof precisaoData)}
              className="flex flex-col gap-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="correta" id="data-correta" />
                <Label htmlFor="data-correta" className="flex items-center gap-2 font-normal cursor-pointer">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Sim, correta
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="incorreta" id="data-incorreta" />
                <Label htmlFor="data-incorreta" className="flex items-center gap-2 font-normal cursor-pointer">
                  <XCircle className="h-4 w-4 text-red-500" />
                  Não, incorreta
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="nao_extraiu" id="data-nao-extraiu" />
                <Label htmlFor="data-nao-extraiu" className="flex items-center gap-2 font-normal cursor-pointer">
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                  Não extraiu a data
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Precisão dos valores */}
          <div className="space-y-2">
            <Label>Os valores dos exames foram extraídos corretamente?</Label>
            <RadioGroup
              value={precisaoValores}
              onValueChange={(value) => setPrecisaoValores(value as typeof precisaoValores)}
              className="flex flex-col gap-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="todos_corretos" id="valores-corretos" />
                <Label htmlFor="valores-corretos" className="flex items-center gap-2 font-normal cursor-pointer">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Todos corretos
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="alguns_incorretos" id="valores-alguns" />
                <Label htmlFor="valores-alguns" className="flex items-center gap-2 font-normal cursor-pointer">
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                  Alguns incorretos
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="maioria_incorreta" id="valores-maioria" />
                <Label htmlFor="valores-maioria" className="flex items-center gap-2 font-normal cursor-pointer">
                  <XCircle className="h-4 w-4 text-red-500" />
                  Maioria incorreta
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Comentário */}
          <div className="space-y-2">
            <Label htmlFor="comentario">Comentário (opcional)</Label>
            <Textarea
              id="comentario"
              placeholder="Descreva problemas específicos ou sugestões de melhoria..."
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={criarFeedback.isPending || avaliacao === 0}
            className="gap-2"
          >
            <Send className="h-4 w-4" />
            {criarFeedback.isPending ? 'Enviando...' : 'Enviar Feedback'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
