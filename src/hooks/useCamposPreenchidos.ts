'use client';

import { useState } from 'react';

function mapear(valores?: Record<string, string>) {
  const inicial: Record<string, boolean> = {};

  for (const [campo, valor] of Object.entries(valores ?? {})) {
    inicial[campo] = valor.trim().length > 0;
  }

  return inicial;
}

// Acompanha quais campos do formulário já têm valor, para habilitar o botão de envio
export function useCamposPreenchidos(valoresIniciais?: Record<string, string>) {
  const [preenchidos, setPreenchidos] = useState<Record<string, boolean>>(() =>
    mapear(valoresIniciais)
  );

  function sincronizar(evento: React.FormEvent<HTMLFormElement>) {
    const dados = new FormData(evento.currentTarget);
    const atual: Record<string, boolean> = {};

    for (const [campo, valor] of dados.entries()) {
      atual[campo] = typeof valor === 'string' && valor.trim().length > 0;
    }

    setPreenchidos(atual);
  }

  function todosPreenchidos(campos: readonly string[]) {
    return campos.every((campo) => preenchidos[campo]);
  }

  return { sincronizar, todosPreenchidos };
}
