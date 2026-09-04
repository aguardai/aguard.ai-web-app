'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';

import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { entrarNaFilaSchema } from '@/features/queue/schemas';
import { entrarNaFilaAtendimento } from '@/features/queue/services/fila';
import { useQueueStore } from '@/features/queue/store';
import { mascararTelefone } from '@/lib/validations';

export interface EntrarNaFilaFormProps {
  unidadeId: string;
}

interface CamposErro {
  nome?: string;
  telefone?: string;
  email?: string;
}

export function EntrarNaFilaForm({ unidadeId }: EntrarNaFilaFormProps) {
  const router = useRouter();
  const definirTicketAtivo = useQueueStore((estado) => estado.definirTicketAtivo);

  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [erros, setErros] = useState<CamposErro>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const camposPreenchidos = nome.trim().length > 0 && telefone.trim().length > 0;

  async function handleSubmit(evento: React.FormEvent) {
    evento.preventDefault();
    setErroGeral(null);

    const resultado = entrarNaFilaSchema.safeParse({ nome, telefone, email });

    if (!resultado.success) {
      const novosErros: CamposErro = {};

      for (const issue of resultado.error.issues) {
        const campo = issue.path[0] as keyof CamposErro;
        novosErros[campo] = issue.message;
      }

      setErros(novosErros);
      return;
    }

    setErros({});
    setEnviando(true);

    const resposta = await entrarNaFilaAtendimento(unidadeId, resultado.data);

    setEnviando(false);

    if (!resposta.sucesso || !resposta.ticket) {
      setErroGeral(resposta.erro ?? 'Não foi possível entrar na fila.');
      return;
    }

    definirTicketAtivo({ ticketId: resposta.ticket.ticket_id, unidadeId });
    router.push('/acompanhar/' + resposta.ticket.ticket_id);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
      <Input
        id="nome"
        label="Nome completo"
        placeholder="Como você gostaria de ser chamado"
        value={nome}
        onChange={(evento) => setNome(evento.target.value)}
        erro={erros.nome}
        autoComplete="name"
        required
      />

      <Input
        id="telefone"
        label="Telefone"
        type="tel"
        inputMode="numeric"
        placeholder="(87) 99999-0000"
        value={telefone}
        onChange={(evento) => setTelefone(mascararTelefone(evento.target.value))}
        erro={erros.telefone}
        dica={!erros.telefone ? 'Usado para localizar seu atendimento.' : undefined}
        autoComplete="tel"
        required
      />

      <Input
        id="email"
        label="E-mail (opcional)"
        type="email"
        placeholder="voce@email.com"
        value={email}
        onChange={(evento) => setEmail(evento.target.value)}
        erro={erros.email}
        autoComplete="email"
      />

      {erroGeral ? <Alert tom="erro">{erroGeral}</Alert> : null}

      <Button type="submit" tamanho="lg" disabled={enviando || !camposPreenchidos}>
        {enviando ? 'Entrando na fila...' : 'Entrar na fila'}
        {enviando ? null : <ArrowRight className="size-4" aria-hidden />}
      </Button>
    </form>
  );
}
