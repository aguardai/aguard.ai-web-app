'use client';

import { useId, useState } from 'react';
import { ChevronDown } from 'lucide-react';

import { cn } from '@/lib/utils';

export interface ItemDuvidaProps {
  pergunta: string;
  resposta: string;
}

// Item do FAQ: a resposta permanece no DOM para que abrir e fechar sejam animados
export function ItemDuvida({ pergunta, resposta }: ItemDuvidaProps) {
  const [aberta, setAberta] = useState(false);
  const idResposta = useId();

  return (
    <div className="rounded-[12px] border border-border bg-white">
      <button
        type="button"
        onClick={() => setAberta((estado) => !estado)}
        aria-expanded={aberta}
        aria-controls={idResposta}
        className="flex w-full cursor-pointer items-center justify-between gap-4 px-6 py-5 text-left font-medium text-foreground"
      >
        {pergunta}
        <ChevronDown
          className={cn(
            'size-5 shrink-0 text-primary transition-transform duration-300 ease-in-out',
            aberta && 'rotate-180'
          )}
          aria-hidden
        />
      </button>

      <div
        id={idResposta}
        role="region"
        inert={!aberta}
        className={cn(
          'grid transition-[grid-template-rows,opacity] duration-300 ease-in-out',
          aberta ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        )}
      >
        <div className="overflow-hidden">
          <p className="px-6 pb-5 text-muted">{resposta}</p>
        </div>
      </div>
    </div>
  );
}
