'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  BarChart3,
  Building2,
  CalendarRange,
  Circle,
  ClipboardList,
  History,
  LayoutDashboard,
  ListOrdered,
  LogOut,
  MapPin,
  Menu,
  Monitor,
  Stethoscope,
  X,
  type LucideIcon,
} from 'lucide-react';

import { Logo } from '@/components/ui/Logo';
import { getSidebarRoutes, type Role } from '@/constants/routes';
import { sair } from '@/features/auth/actions';
import { cn } from '@/lib/utils';

const ROTULO_PAPEL: Record<Role, string> = {
  CLINICA: 'Clínica',
  UNIDADE: 'Unidade',
  PROFISSIONAL: 'Profissional',
  PACIENTE: 'Paciente',
};

const ICONE_ROTA: Record<string, LucideIcon> = {
  '/dashboard': LayoutDashboard,
  '/clinica': Building2,
  '/unidades': MapPin,
  '/guiches': Monitor,
  '/profissionais': Stethoscope,
  '/locacoes': CalendarRange,
  '/filas': ListOrdered,
  '/atendimento': ClipboardList,
  '/atendimento/historico': History,
  '/relatorios': BarChart3,
};

const ITEM =
  'group flex cursor-pointer items-center rounded-[8px] px-2.5 py-2 transition-colors duration-200 ease-in-out focus-visible:outline-2 focus-visible:outline-offset-2';

const ITEM_NAVEGACAO = 'hover:bg-primary/10 hover:text-primary focus-visible:outline-primary';
const ITEM_SAIR =
  'text-danger hover:bg-danger/10 hover:text-danger focus-visible:outline-danger';

// O rótulo nasce com largura zero e cresce na coluna do grid ao passar o mouse
const ROTULO =
  'grid grid-cols-[0fr] transition-[grid-template-columns] duration-300 ease-in-out group-hover:grid-cols-[1fr] group-focus-visible:grid-cols-[1fr]';

export interface AppHeaderProps {
  nome: string;
  papel: Role;
  rotaInicial: string;
}

export function AppHeader({ nome, papel, rotaInicial }: AppHeaderProps) {
  const [aberto, setAberto] = useState(false);
  const caminho = usePathname();
  const rotas = getSidebarRoutes(papel);

  // A rota ativa é a mais específica entre as que casam com o caminho atual
  const ativa = rotas
    .filter((rota) => caminho === rota.path || caminho.startsWith(`${rota.path}/`))
    .sort((a, b) => b.path.length - a.path.length)[0];

  return (
    <header className="shrink-0 border-b border-border bg-white">
      <div className="content-container flex h-16 items-center justify-between gap-4">
        <Link href={rotaInicial} aria-label="Aguard.ai — início">
          <Logo tamanho={34} prioridade />
        </Link>

        <div className="hidden items-center gap-4 md:flex">
          <nav className="flex items-center gap-1">
            {rotas.map((rota) => {
              const Icone = ICONE_ROTA[rota.path] ?? Circle;
              const estaAtiva = ativa?.path === rota.path;

              return (
                <Link
                  key={rota.path}
                  href={rota.path}
                  aria-current={estaAtiva ? 'page' : undefined}
                  className={cn(
                    ITEM,
                    ITEM_NAVEGACAO,
                    estaAtiva ? 'text-primary' : 'text-muted'
                  )}
                >
                  <Icone className="size-5 shrink-0" aria-hidden />
                  <span className={ROTULO}>
                    <span className="overflow-hidden">
                      <span className="pl-2 text-sm font-medium whitespace-nowrap">
                        {rota.label}
                      </span>
                    </span>
                  </span>
                </Link>
              );
            })}

            <form action={sair}>
              <button type="submit" className={cn(ITEM, ITEM_SAIR)}>
                <LogOut className="size-5 shrink-0" aria-hidden />
                <span className={ROTULO}>
                  <span className="overflow-hidden">
                    <span className="pl-2 text-sm font-medium whitespace-nowrap">
                      Sair
                    </span>
                  </span>
                </span>
              </button>
            </form>
          </nav>

          <span className="h-8 w-px shrink-0 bg-border" aria-hidden />

          <span className="flex flex-col text-right leading-tight">
            <span className="text-sm font-medium text-foreground">{nome}</span>
            <span className="text-xs text-muted">{ROTULO_PAPEL[papel]}</span>
          </span>
        </div>

        <button
          type="button"
          onClick={() => setAberto((estado) => !estado)}
          aria-expanded={aberto}
          aria-label={aberto ? 'Fechar menu' : 'Abrir menu'}
          className="cursor-pointer rounded-[8px] p-2 text-primary transition-colors hover:bg-muted-bg md:hidden"
        >
          {aberto ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {aberto ? (
        <div className="border-t border-border bg-white md:hidden">
          <div className="content-container flex flex-col gap-1 py-4">
            {rotas.map((rota) => {
              const Icone = ICONE_ROTA[rota.path] ?? Circle;
              const estaAtiva = ativa?.path === rota.path;

              return (
                <Link
                  key={rota.path}
                  href={rota.path}
                  onClick={() => setAberto(false)}
                  aria-current={estaAtiva ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-3 rounded-[8px] px-2 py-2.5 text-sm transition-colors hover:bg-muted-bg hover:text-primary',
                    estaAtiva
                      ? 'bg-primary/5 font-semibold text-primary'
                      : 'text-muted'
                  )}
                >
                  <Icone className="size-5 shrink-0" aria-hidden />
                  {rota.label}
                </Link>
              );
            })}

            <form action={sair}>
              <button
                type="submit"
                className="flex w-full cursor-pointer items-center gap-3 rounded-[8px] px-2 py-2.5 text-sm text-danger transition-colors hover:bg-danger/10"
              >
                <LogOut className="size-5 shrink-0" aria-hidden />
                Sair
              </button>
            </form>

            <div className="mt-3 flex flex-col border-t border-border pt-4 leading-tight">
              <span className="text-sm font-medium text-foreground">{nome}</span>
              <span className="text-xs text-muted">{ROTULO_PAPEL[papel]}</span>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
