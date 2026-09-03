'use client';

import { useActionState } from 'react';

import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { enviarConviteAcesso } from '@/features/professional/actions';
import type { EstadoConviteAcesso, Profissional } from '@/features/professional/types';

const ESTADO_INICIAL: EstadoConviteAcesso = {};

export interface ConviteAcessoFormProps {
  profissional: Profissional;
}

// Exibida apenas quando o profissional ainda não tem user_id — depois de
// vinculado, o cadastro de acesso não passa mais por aqui
export function ConviteAcessoForm({ profissional }: ConviteAcessoFormProps) {
  const acao = enviarConviteAcesso.bind(null, profissional.id);
  const [estado, executarAcao, pendente] = useActionState(acao, ESTADO_INICIAL);

  if (estado.sucesso) {
    return <Alert tom="sucesso">{estado.sucesso}</Alert>;
  }

  return (
    <form action={executarAcao} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <Input
        id="email-convite"
        name="email"
        type="email"
        label="E-mail de acesso"
        defaultValue={profissional.email ?? ''}
        erro={estado.erro}
        required
      />

      <Button type="submit" disabled={pendente} className="shrink-0">
        {pendente ? 'Enviando...' : 'Convidar para o sistema'}
      </Button>
    </form>
  );
}