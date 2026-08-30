import {
  BarChart3,
  Bell,
  Building2,
  ListOrdered,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';

import { EtiquetaSecao } from '@/features/marketing/components/ui/EtiquetaSecao';

const RECURSOS = [
  {
    Icone: Smartphone,
    titulo: 'Entrada remota na fila',
    texto:
      'O paciente entra de casa, do estacionamento ou da própria recepção.',
  },
  {
    Icone: ListOrdered,
    titulo: 'Posição e espera em tempo real',
    texto:
      'A estimativa usa o tempo médio real daquela unidade nos últimos 30 dias, não um chute fixo.',
  },
  {
    Icone: Bell,
    titulo: 'Painel de chamada',
    texto:
      'Chamar, atender, marcar ausente, cancelar. Quem não comparece volta para o fim da fila com um clique.',
  },
  {
    Icone: Building2,
    titulo: 'Várias unidades, um só lugar',
    texto:
      'Cada unidade opera a própria fila e vê os próprios números. A administração enxerga a rede inteira.',
  },
  {
    Icone: BarChart3,
    titulo: 'Relatórios para decidir',
    texto:
      'Tempo médio de espera, tempo de atendimento, volume por dia, cancelamentos e ausências.',
  },
  {
    Icone: ShieldCheck,
    titulo: 'Isolamento de dados',
    texto:
      'Cada clínica só enxerga o que é dela. O painel público não expõe o nome completo do paciente.',
  },
];

export function Recursos() {
  return (
    <section id="recursos" className="bg-muted-bg py-20 sm:py-28">
      <div className="content-container">
        <div className="mx-auto max-w-2xl text-center">
          <EtiquetaSecao>Recursos</EtiquetaSecao>
          <h2 className="mt-3 font-title text-3xl leading-tight font-bold text-foreground sm:text-4xl">
            O necessário para acabar com a espera improvisada
          </h2>
          <p className="mt-4 text-lg text-muted">
            Sem prontuário, sem financeiro, sem módulo que você não vai usar. O
            Aguard.ai resolve a fila e resolve bem.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {RECURSOS.map(({ Icone, titulo, texto }) => (
            <article
              key={titulo}
              className="flex flex-col gap-4 rounded-[12px] border border-border bg-white p-7 shadow-sm transition-shadow duration-200 hover:shadow-md"
            >
              <span className="flex size-11 items-center justify-center rounded-[8px] bg-primary/10 text-primary">
                <Icone className="size-5" aria-hidden />
              </span>
              <h3 className="font-title text-lg font-bold text-foreground">
                {titulo}
              </h3>
              <p className="text-muted">{texto}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
