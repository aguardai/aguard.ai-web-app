'use client';

import Link from 'next/link';
import { useActionState, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { InputSenha } from '@/components/ui/InputSenha';
import type { PlanoId } from '@/constants/planos';
import { cadastrar } from '@/features/auth/actions';
import { useCheckoutCadastro } from '@/features/auth/hooks/useCheckoutCadastro';
import { dadosClinicaSchema, erroPorCampo, senhaCadastroSchema } from '@/features/auth/schemas';
import type { EstadoFormulario } from '@/features/auth/types';
import { SimuladorPagamentoModal } from '@/features/billing/components/SimuladorPagamentoModal';
import { SeletorPlano } from '@/features/clinic/components/SeletorPlano';
import { useCamposPreenchidos } from '@/hooks/useCamposPreenchidos';
import { cn } from '@/lib/utils';

const ESTADO_INICIAL: EstadoFormulario = {};

type Etapa = 1 | 2 | 3;

const ETAPAS = [
  { numero: 1 as Etapa, rotulo: 'Clínica', campos: ['nomeClinica', 'nome', 'email'] },
  { numero: 2 as Etapa, rotulo: 'Senha', campos: ['senha', 'confirmarSenha'] },
  { numero: 3 as Etapa, rotulo: 'Plano', campos: ['plano'] },
];

export interface CadastroFormProps {
  planoInicial: PlanoId;
}

export function CadastroForm({ planoInicial }: CadastroFormProps) {
  const [estado, acao, pendente] = useActionState(cadastrar, ESTADO_INICIAL);
  const [etapa, setEtapa] = useState<Etapa>(1);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [plano, setPlano] = useState<PlanoId>(planoInicial);
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [checkoutFechado, setCheckoutFechado] = useState(false);
  const formulario = useRef<HTMLFormElement>(null);
  const envioPedido = useRef(false);

  const checkout = useCheckoutCadastro(estado.usuarioId, plano);

  // O plano já nasce marcado, então conta como preenchido desde o primeiro render
  const { sincronizar, todosPreenchidos } = useCamposPreenchidos({
    ...estado.valores,
    plano,
  });

  const etapaAtual = ETAPAS[etapa - 1];
  const podeSeguir = todosPreenchidos(etapaAtual.campos);

  // Erro devolvido pelo servidor leva o usuário à primeira etapa que o contém
  const [estadoTratado, setEstadoTratado] = useState(estado);
  if (estado !== estadoTratado) {
    setEstadoTratado(estado);

    const comErro = ETAPAS.find((passo) => passo.campos.some((campo) => estado.erros?.[campo]));

    if (comErro) {
      setEtapa(comErro.numero);
    }
  }

  // Servidor aprovou o cadastro, mas o plano é pago: o checkout abre por cima
  const checkoutAberto =
    Boolean(estado.aguardandoPagamento && estado.usuarioId) && !checkoutFechado;

  function avancar() {
    if (!formulario.current) return;

    const dados = Object.fromEntries(new FormData(formulario.current));
    const schema = etapa === 1 ? dadosClinicaSchema : senhaCadastroSchema;
    const resultado = schema.safeParse(dados);

    if (!resultado.success) {
      setErros(erroPorCampo(resultado.error));
      return;
    }

    setErros({});
    setEtapa(etapa === 1 ? 2 : 3);
  }

  // O formulário só é enviado pelo clique em "Criar conta": avançar para a última
  // etapa troca o tipo do botão e o navegador tentaria enviar no mesmo clique
  function aoEnviar(evento: React.FormEvent<HTMLFormElement>) {
    if (!envioPedido.current) {
      evento.preventDefault();
      return;
    }

    envioPedido.current = false;
  }

  // Abandonar o checkout deixa a conta no Starter, resolvido no próximo login
  function fecharCheckout() {
    setCheckoutFechado(true);
    checkout.concluir({ sucesso: false, status: 'recusado' });
  }

  function erroDe(campo: string) {
    return estado.erros?.[campo] ?? erros[campo];
  }

  const mensagemFinal = estado.sucesso ?? checkout.mensagemFinal;

  if (mensagemFinal) {
    return (
      <div className="flex flex-col gap-5">
        <Alert tom="sucesso">{mensagemFinal}</Alert>
        <Link href="/login" className="text-center text-sm font-medium text-primary hover:underline">
          Ir para o login
        </Link>
      </div>
    );
  }

  return (
    <>
      <form
        ref={formulario}
        action={acao}
        onChange={sincronizar}
        onSubmit={aoEnviar}
        className="flex flex-col gap-6"
        noValidate
      >
        <ol className="flex items-center gap-3" aria-label="Etapas do cadastro">
          {ETAPAS.map((passo) => (
            <li
              key={passo.numero}
              aria-current={etapa === passo.numero ? 'step' : undefined}
              className="flex flex-1 flex-col gap-2"
            >
              <span
                className={cn(
                  'h-1 rounded-full transition-colors duration-300 ease-in-out',
                  etapa >= passo.numero ? 'bg-primary' : 'bg-border'
                )}
              />
              <span
                className={cn(
                  'text-xs font-medium',
                  etapa >= passo.numero ? 'text-primary' : 'text-muted'
                )}
              >
                {passo.numero}. {passo.rotulo}
              </span>
            </li>
          ))}
        </ol>

        {estado.erro ? <Alert tom="erro">{estado.erro}</Alert> : null}

        <div className={cn(etapa === 1 ? 'flex flex-col gap-5' : 'hidden')}>
          <Input
            id="nomeClinica"
            name="nomeClinica"
            label="Nome da clínica"
            placeholder="Clínica Vida Plena"
            autoComplete="organization"
            defaultValue={estado.valores?.nomeClinica}
            erro={erroDe('nomeClinica')}
            required
          />

          <Input
            id="nome"
            name="nome"
            label="Seu nome"
            placeholder="Nome do responsável pela conta"
            autoComplete="name"
            defaultValue={estado.valores?.nome}
            erro={erroDe('nome')}
            required
          />

          <Input
            id="email"
            name="email"
            type="email"
            label="E-mail"
            placeholder="voce@clinica.com.br"
            autoComplete="email"
            defaultValue={estado.valores?.email}
            erro={erroDe('email')}
            required
          />
        </div>

        <div className={cn(etapa === 2 ? 'flex flex-col gap-5' : 'hidden')}>
          <InputSenha
            id="senha"
            name="senha"
            label="Senha"
            placeholder="Mínimo de 8 caracteres"
            autoComplete="new-password"
            dica="Use pelo menos 8 caracteres."
            value={senha}
            onChange={(evento) => setSenha(evento.target.value)}
            erro={erroDe('senha')}
            required
          />

          <InputSenha
            id="confirmarSenha"
            name="confirmarSenha"
            label="Confirmar senha"
            placeholder="Repita a senha"
            autoComplete="new-password"
            value={confirmarSenha}
            onChange={(evento) => setConfirmarSenha(evento.target.value)}
            erro={erroDe('confirmarSenha')}
            required
          />
        </div>

        <div className={cn(etapa === 3 ? 'flex flex-col gap-5' : 'hidden')}>
          <SeletorPlano
            legenda="Plano da clínica"
            selecionado={plano}
            aoSelecionar={setPlano}
            erro={erroDe('plano')}
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          {etapa > 1 ? (
            <Button
              type="button"
              variante="secondary"
              tamanho="lg"
              onClick={() => setEtapa(etapa === 3 ? 2 : 1)}
              className="sm:w-auto"
            >
              <ArrowLeft className="size-4" aria-hidden />
              Voltar
            </Button>
          ) : null}

          {etapa < 3 ? (
            <Button
              key="continuar"
              type="button"
              tamanho="lg"
              onClick={avancar}
              disabled={!podeSeguir}
              className="w-full sm:flex-1"
            >
              Continuar
              <ArrowRight className="size-4" aria-hidden />
            </Button>
          ) : (
            <Button
              key="criar"
              type="submit"
              tamanho="lg"
              onClick={() => {
                envioPedido.current = true;
              }}
              disabled={pendente || !podeSeguir}
              className="w-full sm:flex-1"
            >
              {pendente ? 'Criando conta...' : 'Criar conta'}
            </Button>
          )}
        </div>

        <p className="text-center text-sm text-muted">
          Já tem conta?{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Entrar
          </Link>
        </p>
      </form>

      <SimuladorPagamentoModal
        key={estado.usuarioId ?? 'sem-cadastro'}
        aberto={checkoutAberto}
        planoSelecionado={plano}
        emailPagador={estado.valores?.email ?? ''}
        aoFechar={fecharCheckout}
        aoSubmeter={checkout.submeter}
        aoVerificarStatus={checkout.verificar}
        aoConcluir={checkout.concluir}
      />
    </>
  );
}
