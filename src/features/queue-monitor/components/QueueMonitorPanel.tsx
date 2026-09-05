'use client';

import { useEffect, useState } from 'react';
import { Clock, ListOrdered, Stethoscope } from 'lucide-react';

import { CabecalhoPagina } from '@/components/ui/CabecalhoPagina';
import { CartaoIndicador } from '@/components/ui/CartaoIndicador';
import { Select } from '@/components/ui/Select';
import { ROTULO_TIPO_FILA } from '@/constants/fila';
import { ITENS_POR_PAGINA } from '@/constants/paginacao';
import type { UnidadeResumo } from '@/features/clinic/types';
import { TabelaFila } from '@/features/queue-monitor/components/TabelaFila';
import { listarFilaPaginada } from '@/features/queue-monitor/services/monitor';
import { createClient } from '@/lib/supabase/client';
import type { PaginaFila } from '@/features/queue-monitor/types';
import { formatarNumero } from '@/lib/utils';

const INTERVALO_ATUALIZACAO_MS = 5000;

export interface QueueMonitorPanelProps {
  unidades: UnidadeResumo[];
  unidadeInicial: string;
  atendimentoInicial: PaginaFila;
  consultaInicial: PaginaFila;
  podeTrocarUnidade: boolean;
}

export function QueueMonitorPanel({
  unidades,
  unidadeInicial,
  atendimentoInicial,
  consultaInicial,
  podeTrocarUnidade,
}: QueueMonitorPanelProps) {
  const [unidadeId, setUnidadeId] = useState(unidadeInicial);
  const [paginaAtendimento, setPaginaAtendimento] = useState(1);
  const [paginaConsulta, setPaginaConsulta] = useState(1);
  const [atendimento, setAtendimento] = useState(atendimentoInicial);
  const [consulta, setConsulta] = useState(consultaInicial);

  // As duas filas são consultadas em paralelo: cada tabela tem a própria página
  // e o total vem do count exato, não do tamanho do array
  useEffect(() => {
    let ativo = true;

    async function carregar() {
      const [recepcao, consultas] = await Promise.all([
        listarFilaPaginada({
          unidadeId,
          tipoFila: 'atendimento',
          pagina: paginaAtendimento,
          porPagina: ITENS_POR_PAGINA,
        }),
        listarFilaPaginada({
          unidadeId,
          tipoFila: 'consulta',
          pagina: paginaConsulta,
          porPagina: ITENS_POR_PAGINA,
        }),
      ]);

      if (ativo) {
        setAtendimento(recepcao);
        setConsulta(consultas);
      }
    }

    carregar();
    const temporizador = setInterval(carregar, INTERVALO_ATUALIZACAO_MS);

    // O broadcast da Fila 1 traz a atualização na hora; a varredura periódica
    // continua como rede de segurança e cobre a Fila 2
    const supabase = createClient();
    const canal = supabase
      .channel('atendimento:unidade:' + unidadeId)
      .on('broadcast', { event: '*' }, () => carregar())
      .subscribe();

    return () => {
      ativo = false;
      clearInterval(temporizador);
      supabase.removeChannel(canal);
    };
  }, [unidadeId, paginaAtendimento, paginaConsulta]);

  const unidadeAtual = unidades.find((unidade) => unidade.id === unidadeId);
  const totalNaFila = atendimento.total + consulta.total;
  const totalAguardando = atendimento.aguardando + consulta.aguardando;

  function trocarUnidade(valor: string) {
    setUnidadeId(valor);
    setPaginaAtendimento(1);
    setPaginaConsulta(1);
  }

  return (
    <div className="content-container flex flex-col gap-6 py-8">
      <CabecalhoPagina
        titulo="Filas"
        descricao={
          unidadeAtual
            ? 'Recepção e consulta em tempo real na ' + unidadeAtual.nome + '.'
            : 'Recepção e consulta em tempo real.'
        }
      />

      {podeTrocarUnidade ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:max-w-xl">
          <Select
            id="filtro-unidade"
            label="Unidade"
            opcoes={unidades.map((unidade) => ({ valor: unidade.id, rotulo: unidade.nome }))}
            value={unidadeId}
            onChange={(evento) => trocarUnidade(evento.target.value)}
          />
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <CartaoIndicador
          Icone={ListOrdered}
          rotulo="Tickets na fila"
          valor={formatarNumero(totalNaFila)}
          detalhe={unidadeAtual ? 'Hoje na ' + unidadeAtual.nome : 'Hoje'}
        />
        <CartaoIndicador
          Icone={Clock}
          rotulo="Aguardando"
          valor={formatarNumero(totalAguardando)}
          detalhe="Ainda não chamados"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <TabelaFila
          titulo={'Fila 1 · ' + ROTULO_TIPO_FILA.atendimento}
          Icone={ListOrdered}
          dados={atendimento}
          pagina={paginaAtendimento}
          porPagina={ITENS_POR_PAGINA}
          aoMudarPagina={setPaginaAtendimento}
        />

        <TabelaFila
          titulo={'Fila 2 · ' + ROTULO_TIPO_FILA.consulta}
          Icone={Stethoscope}
          dados={consulta}
          pagina={paginaConsulta}
          porPagina={ITENS_POR_PAGINA}
          aoMudarPagina={setPaginaConsulta}
        />
      </div>
    </div>
  );
}
