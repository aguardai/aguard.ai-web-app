'use client';

import Link from 'next/link';
import { useActionState } from 'react';

import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { entrar } from '@/features/auth/actions';
import { useCamposPreenchidos } from '@/hooks/useCamposPreenchidos';
import type { EstadoFormulario } from '@/features/auth/types';

const ESTADO_INICIAL: EstadoFormulario = {};
const OBRIGATORIOS = ['email', 'senha'] as const;

export function LoginForm() {
  const [estado, acao, pendente] = useActionState(entrar, ESTADO_INICIAL);
  const { sincronizar, todosPreenchidos } = useCamposPreenchidos(estado.valores);

  return (
    <form
      action={acao}
      onChange={sincronizar}
      className="flex flex-col gap-5"
      noValidate
    >
      {estado.erro ? <Alert tom="erro">{estado.erro}</Alert> : null}

      <Input
        id="email"
        name="email"
        type="email"
        label="E-mail"
        placeholder="voce@clinica.com.br"
        autoComplete="email"
        defaultValue={estado.valores?.email}
        erro={estado.erros?.email}
        required
      />

      <Input
        id="senha"
        name="senha"
        type="password"
        label="Senha"
        placeholder="••••••••"
        autoComplete="current-password"
        erro={estado.erros?.senha}
        required
      />

      <Button
        type="submit"
        tamanho="lg"
        disabled={pendente || !todosPreenchidos(OBRIGATORIOS)}
        className="w-full"
      >
        {pendente ? 'Entrando...' : 'Entrar'}
      </Button>

      <p className="text-center text-sm text-muted">
        Ainda não tem conta?{' '}
        <Link href="/cadastro" className="font-medium text-primary hover:underline">
          Criar conta grátis
        </Link>
      </p>
    </form>
  );
}
