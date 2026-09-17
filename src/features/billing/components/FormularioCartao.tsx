'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

// Cenários do sandbox do Mercado Pago: o nome do titular decide o resultado
const CENARIOS_TESTE = [
  { valor: 'APRO', rotulo: 'Aprovado' },
  { valor: 'OTHE', rotulo: 'Recusado' },
];

export interface FormularioCartaoProps {
  pendente: boolean;
  aoCancelar: () => void;
  aoConfirmar: (statusTeste: string) => void;
}

function formatarNumeroCartao(valor: string) {
  return valor.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
}

function formatarValidade(valor: string) {
  const digitos = valor.replace(/\D/g, '').slice(0, 4);

  return digitos.length > 2 ? digitos.slice(0, 2) + '/' + digitos.slice(2) : digitos;
}

// Os dados digitados ficam só na tela: a cobrança usa o cartão de teste do
// provedor e o cenário escolhido abaixo
export function FormularioCartao({ pendente, aoCancelar, aoConfirmar }: FormularioCartaoProps) {
  const [numero, setNumero] = useState('');
  const [nome, setNome] = useState('');
  const [validade, setValidade] = useState('');
  const [cvv, setCvv] = useState('');
  const [statusTeste, setStatusTeste] = useState(CENARIOS_TESTE[0].valor);

  const preenchido = numero.length === 19 && nome.trim() !== '' && validade.length === 5 && cvv.length >= 3;

  function handleSubmit(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    aoConfirmar(statusTeste);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
      <Input
        id="cartao-numero"
        label="Número do cartão"
        inputMode="numeric"
        autoComplete="off"
        placeholder="0000 0000 0000 0000"
        value={numero}
        onChange={(evento) => setNumero(formatarNumeroCartao(evento.target.value))}
        disabled={pendente}
        required
      />

      <Input
        id="cartao-nome"
        label="Nome impresso no cartão"
        autoComplete="off"
        value={nome}
        onChange={(evento) => setNome(evento.target.value.toUpperCase())}
        disabled={pendente}
        required
      />

      <div className="grid grid-cols-2 gap-5">
        <Input
          id="cartao-validade"
          label="Validade"
          inputMode="numeric"
          autoComplete="off"
          placeholder="MM/AA"
          value={validade}
          onChange={(evento) => setValidade(formatarValidade(evento.target.value))}
          disabled={pendente}
          required
        />

        <Input
          id="cartao-cvv"
          label="CVV"
          inputMode="numeric"
          autoComplete="off"
          placeholder="123"
          value={cvv}
          onChange={(evento) => setCvv(evento.target.value.replace(/\D/g, '').slice(0, 4))}
          disabled={pendente}
          required
        />
      </div>

      <div className="rounded-[8px] bg-muted-bg p-4">
        <Select
          id="cartao-cenario"
          label="Ambiente de testes — resultado simulado"
          opcoes={CENARIOS_TESTE}
          value={statusTeste}
          onChange={(evento) => setStatusTeste(evento.target.value)}
          disabled={pendente}
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variante="secondary"
          onClick={aoCancelar}
          disabled={pendente}
          className="w-full sm:w-auto"
        >
          Cancelar
        </Button>

        <Button type="submit" disabled={pendente || !preenchido} className="w-full sm:w-auto">
          {pendente ? 'Processando...' : 'Confirmar pagamento'}
        </Button>
      </div>
    </form>
  );
}
