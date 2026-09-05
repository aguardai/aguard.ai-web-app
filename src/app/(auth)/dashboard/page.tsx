// Dashboard principal — indicadores do dia, volume dos últimos 14 dias e uso do plano
// Acesso: CLINICA, UNIDADE
import { redirect } from 'next/navigation';
import { Building2, Clock, ListOrdered, Stethoscope, Ticket, Timer } from 'lucide-react';

import { Alert } from '@/components/ui/Alert';
import { PainelRecepcao } from '@/features/attendance/components/PainelRecepcao';
import {
  listarFilaRecepcao,
  listarGuichesDaUnidade,
} from '@/features/attendance/services/recepcao';
import { CartaoUsoPlano } from '@/features/clinic/components/CartaoUsoPlano';
import { buscarUsoPlano } from '@/features/clinic/services/clinica';
import { exigirPerfil } from '@/features/auth/services/sessao';
import { CartaoIndicador } from '@/components/ui/CartaoIndicador';
import { GraficoDiario } from '@/features/reports/components/GraficoDiario';
import { TabelaUnidades } from '@/features/reports/components/TabelaUnidades';
import {
  buscarResumoDashboard,
  buscarSerieDiaria,
  listarResumoUnidades,
} from '@/features/reports/services/dashboard';
import { formatarMinutos, formatarNumero } from '@/lib/utils';

export const metadata = { title: 'Dashboard — Aguard.ai' };

const DIAS_DA_SERIE = 14;

export default async function DashboardPage() {
  const perfil = await exigirPerfil();

  // O profissional tem o próprio painel de fila
  if (perfil.papel === 'profissional') {
    redirect('/atendimento');
  }

  const ehClinica = perfil.papel === 'clinica';

  // O painel de chamada da recepção só existe para a unidade, que opera a Fila 1
  const unidadeDaRecepcao = !ehClinica ? perfil.unidade_id : null;

  // As consultas são independentes e as views do dashboard levam mais de um
  // segundo cada: em série a tela demoraria o dobro
  const [resumo, serie, uso, unidades, filaRecepcao, guiches] = await Promise.all([
    buscarResumoDashboard(perfil),
    buscarSerieDiaria(DIAS_DA_SERIE, ehClinica ? null : perfil.unidade_id),
    ehClinica ? buscarUsoPlano() : Promise.resolve(null),
    ehClinica ? listarResumoUnidades() : Promise.resolve([]),
    unidadeDaRecepcao ? listarFilaRecepcao(unidadeDaRecepcao) : Promise.resolve([]),
    unidadeDaRecepcao ? listarGuichesDaUnidade(unidadeDaRecepcao) : Promise.resolve([]),
  ]);

  if (!resumo) {
    return (
      <div className="content-container py-8">
        <Alert tom="erro">
          Não foi possível carregar os indicadores agora. Atualize a página em instantes.
        </Alert>
      </div>
    );
  }

  return (
    <div className="content-container flex flex-col gap-6 py-8">
      <header>
        <h1 className="font-title text-2xl font-bold text-foreground">
          Olá, {perfil.nome.split(' ')[0]}
        </h1>
        <p className="text-sm text-muted">
          Visão consolidada da sua {ehClinica ? 'clínica' : 'unidade'}.
        </p>
      </header>

      {unidadeDaRecepcao ? (
        <PainelRecepcao fila={filaRecepcao} guiches={guiches} />
      ) : null}

      <section className="flex flex-col gap-4">
        {unidadeDaRecepcao ? (
          <h2 className="font-title text-base font-bold text-foreground">Estatísticas</h2>
        ) : null}

        <div className="flex flex-col gap-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <CartaoIndicador
              Icone={Ticket}
              rotulo="Tickets hoje"
              valor={formatarNumero(resumo.ticketsHoje)}
              detalhe={`${formatarNumero(resumo.finalizadosHoje)} finalizados`}
            />
            <CartaoIndicador
              Icone={ListOrdered}
              rotulo="Na fila agora"
              valor={formatarNumero(resumo.aguardandoAgora)}
              detalhe="Aguardando ou já chamados"
            />
            <CartaoIndicador
              Icone={Clock}
              rotulo="Espera média hoje"
              valor={formatarMinutos(resumo.esperaMediaHoje)}
              detalhe="Tempo na fila"
            />
            <CartaoIndicador
              Icone={Timer}
              rotulo="Duração média (30 dias)"
              valor={formatarMinutos(resumo.duracaoMedia30d)}
              detalhe="Tempo de atendimento"
            />
          </div>

          <div className={ehClinica ? 'grid gap-6 lg:grid-cols-[2fr_1fr]' : 'grid gap-6'}>
            <GraficoDiario pontos={serie} titulo="Volume de atendimentos" />

            {ehClinica && uso ? <CartaoUsoPlano uso={uso} comLinkParaGestao /> : null}
          </div>
        </div>
      </section>

      {ehClinica ? (
        <section className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-title text-base font-bold text-foreground">
              Movimento por unidade
            </h2>

            <div className="flex w-full flex-wrap justify-center gap-4 text-sm text-muted sm:w-auto sm:justify-start">
              <span className="inline-flex items-center gap-1.5">
                <Building2 className="size-4" aria-hidden />
                {formatarNumero(resumo.totalUnidades ?? 0)} unidades
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Stethoscope className="size-4" aria-hidden />
                {formatarNumero(resumo.totalProfissionais)} profissionais
              </span>
            </div>
          </div>

          <TabelaUnidades unidades={unidades} />
        </section>
      ) : null}
    </div>
  );
}
