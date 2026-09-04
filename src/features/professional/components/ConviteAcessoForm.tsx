'use client';

import { useActionState } from 'react';
import { Send } from 'lucide-react';

import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { enviarConviteAcesso } from '@/features/professional/actions';
import type { EstadoConviteAcesso, Profissional } from '@/features/professional/types';

const ESTADO_INICIAL: EstadoConviteAcesso = {};

export interface ConviteAcessoFormProps {
  profissional: Profissional;
}

// O convite usa o e-mail que já está no cadastro; sem ele, a edição vem antes
export function ConviteAcessoForm({ profissional }: ConviteAcessoFormProps) {
  const acao = enviarConviteAcesso.bind(null, profissional.id);
  const [estado, executarAcao, pendente] = useActionState(acao, ESTADO_INICIAL);

  if (estado.sucesso) {
    return <Alert tom="sucesso">{estado.sucesso}</Alert>;
  }

  if (!profissional.email) {
    return (
      <Alert tom="info">
        Cadastre um e-mail de contato na edição do profissional para liberar o convite de
        acesso.
      </Alert>
    );
  }

  return (
    <form action={executarAcao} className="flex flex-col gap-3">
      {estado.erro ? <Alert tom="erro">{estado.erro}</Alert> : null}

      <input type="hidden" name="email" value={profissional.email} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted">
          Este profissional ainda não tem login. O convite vai para{' '}
          <span className="font-medium text-foreground">{profissional.email}</span>.
        </p>

        <Button type="submit" disabled={pendente} className="w-full shrink-0 sm:w-auto">
          <Send className="size-4" aria-hidden />
          {pendente ? 'Enviando...' : 'Convidar'}
        </Button>
      </div>
    </form>
  );
}
