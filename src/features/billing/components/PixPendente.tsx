'use client';

import { useState } from 'react';
import Image from 'next/image';
import { CheckCircle2, Copy, XCircle } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import type { DadosPix, StatusPagamento } from '@/lib/pagamento/types';

const TAMANHO_QR = 192;

export interface PixPendenteProps {
  pix: DadosPix;
  status: StatusPagamento;
  aoAdiar: () => void;
}

// QR Code do Pix gerado no sandbox e o estado do polling de confirmação
export function PixPendente({ pix, status, aoAdiar }: PixPendenteProps) {
  const [copiado, setCopiado] = useState(false);

  async function handleCopiar() {
    await navigator.clipboard.writeText(pix.copiaECola);
    setCopiado(true);
  }

  if (status === 'aprovado') {
    return (
      <div className="flex flex-col items-center gap-2 py-6 text-center">
        <CheckCircle2 className="size-8 text-success" aria-hidden />
        <p className="font-title text-lg font-bold text-foreground">Pagamento confirmado</p>
      </div>
    );
  }

  if (status === 'recusado') {
    return (
      <div className="flex flex-col items-center gap-2 py-6 text-center">
        <XCircle className="size-8 text-danger" aria-hidden />
        <p className="font-title text-lg font-bold text-foreground">Pagamento não aprovado</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <Image
        src={'data:image/png;base64,' + pix.qrCodeBase64}
        alt="QR Code do Pix"
        width={TAMANHO_QR}
        height={TAMANHO_QR}
        unoptimized
        className="rounded-[8px] border border-border"
      />

      <Button
        type="button"
        variante="secondary"
        tamanho="sm"
        onClick={handleCopiar}
        className="w-full max-w-full"
      >
        <Copy className="size-4 shrink-0" aria-hidden />
        <span className="truncate">{copiado ? 'Código copiado' : 'Copiar código Pix'}</span>
      </Button>

      <p role="status" aria-live="polite" className="text-sm text-muted">
        Aguardando confirmação. Verificamos automaticamente a cada poucos segundos.
      </p>

      <Button type="button" variante="ghost" onClick={aoAdiar}>
        Fechar e continuar depois
      </Button>
    </div>
  );
}
