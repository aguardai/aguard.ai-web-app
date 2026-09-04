'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

import { AcaoIcone } from '@/components/ui/AcaoIcone';
import { cn } from '@/lib/utils';

export interface ModalProps {
  aberto: boolean;
  titulo: string;
  descricao?: string;
  aoFechar: () => void;
  children: React.ReactNode;
  className?: string;
}

// Usa o <dialog> nativo: o navegador cuida do foco, do Esc e do backdrop
export function Modal({
  aberto,
  titulo,
  descricao,
  aoFechar,
  children,
  className,
}: ModalProps) {
  const referencia = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialogo = referencia.current;

    if (!dialogo) return;

    if (aberto && !dialogo.open) {
      dialogo.showModal();
    }

    if (!aberto && dialogo.open) {
      dialogo.close();
    }
  }, [aberto]);

  return (
    <dialog
      ref={referencia}
      onClose={aoFechar}
      onClick={(evento) => {
        if (evento.target === referencia.current) {
          aoFechar();
        }
      }}
      className={cn(
        // O preflight do Tailwind zera a margem que o user-agent usa para
        // centralizar o dialog, entao o m-auto precisa voltar aqui
        'm-auto w-[calc(100vw-2rem)] max-w-2xl rounded-[12px] border border-border bg-white p-0 shadow-2xl',
        // O top layer muda a ordem de pintura, mas a heranca continua vindo do
        // pai no DOM: sem isso o modal aberto dentro de uma tabela herda o
        // whitespace-nowrap dela e o texto para de quebrar linha
        'text-left whitespace-normal',
        'backdrop:bg-foreground/60',
        className
      )}
    >
      <div className="flex flex-col gap-5 p-5 sm:p-6">
        <header className="flex flex-col gap-1">
          <div className="flex items-center justify-between gap-4">
            <h2 className="min-w-0 font-title text-lg font-bold text-foreground">{titulo}</h2>

            <AcaoIcone rotulo="Fechar" onClick={aoFechar} className="shrink-0">
              <X className="size-4" aria-hidden />
            </AcaoIcone>
          </div>

          {descricao ? <p className="text-sm text-muted">{descricao}</p> : null}
        </header>

        {children}
      </div>
    </dialog>
  );
}
