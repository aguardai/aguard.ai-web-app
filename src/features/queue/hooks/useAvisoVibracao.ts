'use client';

import { useEffect } from 'react';

// Dois toques curtos e um longo, em milissegundos: vibra, pausa, vibra...
const VIBRACAO_CHAMADO = [200, 100, 200, 100, 500];

function vibrar(): boolean {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') {
    return false;
  }

  return navigator.vibrate(VIBRACAO_CHAMADO);
}

// Vibra o aparelho quando a senha é chamada. Se o navegador bloquear por falta
// de interação, vibra no primeiro toque na tela
export function useAvisoVibracao(foiChamado: boolean) {
  useEffect(() => {
    if (!foiChamado || vibrar()) return;

    const aoTocar = () => {
      vibrar();
    };

    document.addEventListener('pointerdown', aoTocar, { once: true });

    return () => document.removeEventListener('pointerdown', aoTocar);
  }, [foiChamado]);
}
