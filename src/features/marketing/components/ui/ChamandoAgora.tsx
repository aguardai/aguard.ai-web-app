'use client';

import { useEffect, useState } from 'react';

const INTERVALO_MS = 2600;
const SENHA_INICIAL = 'REC-039';

function sortearSenha() {
  return `REC-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
}

// Cartão decorativo do hero: senha chamada trocando em intervalo fixo
export function ChamandoAgora() {
  const [senha, setSenha] = useState(SENHA_INICIAL);

  useEffect(() => {
    const intervalo = setInterval(() => setSenha(sortearSenha()), INTERVALO_MS);
    return () => clearInterval(intervalo);
  }, []);

  return (
    <div
      aria-hidden
      className="absolute -right-4 -bottom-5 hidden rounded-[12px] bg-white px-5 py-3.5 shadow-xl sm:block"
    >
      <p className="flex items-center gap-2 text-xs text-muted">
        <span className="relative flex size-2 shrink-0">
          <span className="pulso-ao-vivo absolute inline-flex size-full rounded-full bg-success" />
          <span className="relative inline-flex size-2 rounded-full bg-success" />
        </span>
        Chamando agora
      </p>
      <p className="font-title text-lg font-bold text-primary tabular-nums">
        {senha}
      </p>
    </div>
  );
}
