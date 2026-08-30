import { QrCode, Repeat, Stethoscope } from 'lucide-react';

import { EtiquetaSecao } from '@/features/marketing/components/ui/EtiquetaSecao';

const PASSOS = [
  {
    Icone: QrCode,
    titulo: 'O paciente entra pelo celular',
    texto:
      'Ele lê o QR Code da recepção, informa nome e telefone e recebe a senha. Não precisa instalar aplicativo nem criar conta.',
  },
  {
    Icone: Repeat,
    titulo: 'A recepção chama e encaminha',
    texto:
      'O primeiro guichê que fica livre chama o próximo da fila, faz o check-in e escolhe o profissional. Ao finalizar, o paciente vai para a fila da consulta sozinho.',
  },
  {
    Icone: Stethoscope,
    titulo: 'O profissional recebe pronto',
    texto:
      'Ele vê apenas a fila dele, já com o paciente triado. Sem papel circulando e sem alguém gritando nome na sala de espera.',
  },
];

export function ComoFunciona() {
  return (
    <section id="como-funciona" className="py-20 sm:py-28">
      <div className="content-container">
        <div className="mx-auto max-w-2xl text-center">
          <EtiquetaSecao>Como funciona</EtiquetaSecao>
          <h2 className="mt-3 font-title text-3xl leading-tight font-bold text-foreground sm:text-4xl">
            Três passos, do QR Code até a consulta
          </h2>
          <p className="mt-4 text-lg text-muted">
            A fila da recepção e a fila do profissional conversam entre si. O paciente
            não precisa entrar duas vezes, e ninguém se perde no caminho.
          </p>
        </div>

        <ol className="mt-14 grid gap-6 md:grid-cols-3">
          {PASSOS.map(({ Icone, titulo, texto }, indice) => (
            <li
              key={titulo}
              className="relative flex flex-col gap-4 rounded-[12px] border border-border bg-white p-7 shadow-sm"
            >
              <span className="flex size-11 items-center justify-center rounded-[8px] bg-primary/10 text-primary">
                <Icone className="size-5" aria-hidden />
              </span>

              <span className="font-title text-sm font-bold text-primary-light">
                Passo {indice + 1}
              </span>

              <h3 className="font-title text-lg font-bold text-foreground">
                {titulo}
              </h3>
              <p className="text-muted">{texto}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
