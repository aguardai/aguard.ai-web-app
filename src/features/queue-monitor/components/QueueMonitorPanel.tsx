'use client';

import { useEffect, useState } from 'react';
import { Clock, ListOrdered } from 'lucide-react';

import { Badge } from '@/components/ui/Badge';
import { CabecalhoPagina } from '@/components/ui/CabecalhoPagina';
import { CartaoIndicador } from '@/components/ui/CartaoIndicador';
import { Paginacao } from '@/components/ui/Paginacao';
import { Select } from '@/components/ui/Select';
import { ROTULO_STATUS, ROTULO_TIPO_FILA, TOM_STATUS, type TipoFila } from '@/constants/fila';
import type { UnidadeResumo } from '@/features/clinic/types';
import { listarFilaPaginada } from '@/features/queue-monitor/services/monitor';
import type { PaginaFila } from '@/features/queue-monitor/types';
import { formatarHora, formatarNumero } from '@/lib/utils';

const INTERVALO_ATUALIZACAO_MS = 5000;
const POR_PAGINA = 20;
const TODAS = 'todas';

const OPCOES_TIPO = [
  { valor: TODAS, rotulo: 'As duas filas' },
  { valor: 'atendimento', rotulo: ROTULO_TIPO_FILA.atendimento },
  { valor: 'consulta', rotulo: ROTULO_TIPO_FILA.consulta },
];

export interface QueueMonitorPanelProps {
  unidades: UnidadeResumo[];
  unidadeInicial: string;
  paginaInicial: PaginaFila;
  podeTrocarUnidade: boolean;
}

export function QueueMonitorPanel({
  unidades,
  unidadeInicial,
  paginaInicial,
  podeTrocarUnidade,
}: QueueMonitorPanelProps) {
  const [unidadeId, setUnidadeId] = useState(unidadeInicial);
  const [tipo, setTipo] = useState(TODAS);
  const [pagina, setPagina] = useState(1);
  const [dados, setDados] = useState<PaginaFila>(paginaInicial);

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      const resposta = await listarFilaPaginada({
        unidadeId: unidadeId || undefined,
        tipoFila: tipo === TODAS ? undefined : (tipo as TipoFila),
        pagina,
        porPagina: POR_PAGINA,
      });

      if (ativo) {
        setDados(resposta);
      }
    }

    carregar();
    const temporizador = setInterval(carregar, INTERVALO_ATUALIZACAO_MS);

    return () => {
      ativo = false;
      clearInterval(temporizador);
    };
  }, [unidadeId, tipo, pagina]);

  const unidadeAtual = unidades.find((unidade) => unidade.id === unidadeId);

  function trocarUnidade(valor: string) {
    setUnidadeId(valor);
    setPagina(1);
  }

  function trocarTipo(valor: string) {
    setTipo(valor);
    setPagina(1);
  }

  return (
    <div className="content-container flex flex-col gap-6 py-8">
      <CabecalhoPagina
        titulo="Filas"
        descricao={
          unidadeAtual
            ? `Recepção e consulta em tempo real na ${unidadeAtual.nome}.`
            : 'Recepção e consulta em tempo real.'
        }
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <CartaoIndicador
          Icone={ListOrdered}
          rotulo="Tickets na fila"
          valor={formatarNumero(dados.total)}
          detalhe={unidadeAtual ? `Hoje na ${unidadeAtual.nome}` : 'Hoje'}
        />
        <CartaoIndicador
          Icone={Clock}
          rotulo="Aguardando"
          valor={formatarNumero(dados.aguardando)}
          detalhe="Ainda não chamados"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:max-w-xl">
        <Select
          id="filtro-unidade"
          label="Unidade"
          opcoes={unidades.map((unidade) => ({ valor: unidade.id, rotulo: unidade.nome }))}
          value={unidadeId}
          onChange={(evento) => trocarUnidade(evento.target.value)}
          disabled={!podeTrocarUnidade}
        />

        <Select
          id="filtro-tipo"
          label="Fila"
          opcoes={OPCOES_TIPO}
          value={tipo}
          onChange={(evento) => trocarTipo(evento.target.value)}
        />
      </div>

      {dados.tickets.length === 0 ? (
        <div className="rounded-[12px] border border-dashed border-border p-10 text-center text-muted">
          Nenhum ticket na fila agora.
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-[12px] border border-border bg-white">
            <table className="w-full min-w-[46rem] text-left text-sm">
              <thead className="bg-muted-bg text-xs font-medium tracking-wide text-muted uppercase">
                <tr>
                  <th className="px-4 py-3 whitespace-nowrap">Senha</th>
                  <th className="w-full px-4 py-3">Paciente</th>
                  <th className="px-4 py-3 whitespace-nowrap">Fila</th>
                  <th className="px-4 py-3 whitespace-nowrap">Origem</th>
                  <th className="px-4 py-3 whitespace-nowrap">Entrada</th>
                  <th className="px-4 py-3 whitespace-nowrap">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {dados.tickets.map((ticket) => (
                  <tr key={ticket.ticket_id} className="transition-colors hover:bg-muted-bg/60">
                    <td className="px-4 py-3 font-mono font-semibold whitespace-nowrap text-primary">
                      {ticket.senha ?? '—'}
                    </td>
                    <td className="w-full px-4 py-3">
                      <p className="font-medium text-foreground">
                        {ticket.paciente_nome ?? 'Paciente sem nome'}
                      </p>
                      {ticket.prioridade === 'preferencial' ? (
                        <Badge tom="alerta" className="mt-1">
                          Preferencial
                        </Badge>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted">
                      {ROTULO_TIPO_FILA[ticket.tipo_fila]}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted">
                      {ticket.origem ?? '—'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted tabular-nums">
                      {formatarHora(ticket.entrada_fila)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge tom={TOM_STATUS[ticket.status]}>
                        {ROTULO_STATUS[ticket.status]}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Paginacao
            pagina={pagina}
            porPagina={POR_PAGINA}
            total={dados.total}
            aoMudar={setPagina}
          />
        </>
      )}
    </div>
  );
}
