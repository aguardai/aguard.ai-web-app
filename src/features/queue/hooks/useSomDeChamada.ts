'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// Duas notas curtas (lá e ré), com ataque e queda suaves para não estalar
const NOTAS_HZ = [880, 1174.66];
const DURACAO_NOTA_S = 0.18;
const VOLUME = 0.25;

function tocarToque(contexto: AudioContext) {
  NOTAS_HZ.forEach((frequencia, indice) => {
    const inicio = contexto.currentTime + indice * DURACAO_NOTA_S;
    const oscilador = contexto.createOscillator();
    const ganho = contexto.createGain();

    oscilador.type = 'sine';
    oscilador.frequency.value = frequencia;

    ganho.gain.setValueAtTime(0, inicio);
    ganho.gain.linearRampToValueAtTime(VOLUME, inicio + 0.02);
    ganho.gain.exponentialRampToValueAtTime(0.001, inicio + DURACAO_NOTA_S);

    oscilador.connect(ganho).connect(contexto.destination);
    oscilador.start(inicio);
    oscilador.stop(inicio + DURACAO_NOTA_S);
  });
}

// Toca um aviso sonoro sempre que a chave muda (uma nova senha chamada).
// O navegador só libera áudio depois de um clique, por isso o som começa
// desligado e o painel oferece um botão para ativar
export function useSomDeChamada(chave: string | null) {
  const [ativo, setAtivo] = useState(false);
  const contextoRef = useRef<AudioContext | null>(null);
  const chaveAnteriorRef = useRef(chave);

  const alternar = useCallback(() => {
    if (!contextoRef.current) {
      contextoRef.current = new AudioContext();
    }

    const contexto = contextoRef.current;

    setAtivo((atual) => {
      const proximo = !atual;

      if (proximo) {
        // O clique que ligou o som é a interação que o navegador exige
        void contexto.resume().then(() => tocarToque(contexto));
      }

      return proximo;
    });
  }, []);

  useEffect(() => {
    if (chave === chaveAnteriorRef.current) return;

    chaveAnteriorRef.current = chave;

    if (ativo && chave && contextoRef.current) {
      tocarToque(contextoRef.current);
    }
  }, [chave, ativo]);

  useEffect(() => {
    return () => {
      void contextoRef.current?.close();
    };
  }, []);

  return { somAtivo: ativo, alternarSom: alternar };
}
