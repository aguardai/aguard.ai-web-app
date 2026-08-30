// Planos comerciais simulados. Espelha a tabela public.plano_limite do banco.

export const PLANO_IDS = ['starter', 'pro', 'business', 'enterprise'] as const;

export type PlanoId = (typeof PLANO_IDS)[number];

export interface Plano {
  id: PlanoId;
  nome: string;
  precoMensal: number;
  chamada: string;
  limites: {
    unidades: number;
    guiches: number;
    profissionais: number;
    ticketsMes: number;
  };
  recursos: string[];
  suporte: string;
  destaque: boolean;
}

// Disponíveis em qualquer plano, inclusive no gratuito
export const RECURSOS_INCLUSOS: string[] = [
  'Fila compartilhada por unidade',
  'Entrada por QR Code, sem aplicativo',
  'Posição e espera estimada em tempo real',
  'Painel de chamada em tempo real',
  'Encaminhamento automático da recepção para a consulta',
  'Prioridade para atendimento preferencial',
  'Relatórios de tempo médio e volume',
  'Histórico completo de auditoria',
  'Isolamento de dados por clínica',
];

export const PLANOS: Plano[] = [
  {
    id: 'starter',
    nome: 'Starter',
    precoMensal: 0,
    chamada: 'Para o consultório que está começando a organizar a espera.',
    limites: { unidades: 1, guiches: 2, profissionais: 3, ticketsMes: 500 },
    recursos: ['1 unidade e 2 guichês', 'Até 3 profissionais', '500 atendimentos por mês'],
    suporte: 'Suporte por e-mail',
    destaque: false,
  },
  {
    id: 'pro',
    nome: 'Pro',
    precoMensal: 39.9,
    chamada: 'Para a clínica que já tem fila de verdade todos os dias.',
    limites: { unidades: 3, guiches: 8, profissionais: 15, ticketsMes: 3000 },
    recursos: [
      '3 unidades e 8 guichês',
      'Até 15 profissionais',
      '3.000 atendimentos por mês',
      'Acesso separado por unidade',
    ],
    suporte: 'Suporte em até 1 dia útil',
    destaque: true,
  },
  {
    id: 'business',
    nome: 'Business',
    precoMensal: 129.9,
    chamada: 'Para redes com várias unidades operando ao mesmo tempo.',
    limites: { unidades: 10, guiches: 30, profissionais: 60, ticketsMes: 15000 },
    recursos: [
      '10 unidades e 30 guichês',
      'Até 60 profissionais',
      '15.000 atendimentos por mês',
      'Acesso separado por unidade',
      'Dashboard consolidado da rede',
    ],
    suporte: 'Suporte prioritário',
    destaque: false,
  },
  {
    id: 'enterprise',
    nome: 'Enterprise',
    precoMensal: 349.9,
    chamada: 'Para operações grandes, sem teto de volume.',
    limites: {
      unidades: 999,
      guiches: 999,
      profissionais: 999,
      ticketsMes: 999999,
    },
    recursos: [
      'Unidades e guichês ilimitados',
      'Profissionais ilimitados',
      'Volume de atendimentos ilimitado',
      'Acesso separado por unidade',
      'Dashboard consolidado da rede',
      'Suporte com canal dedicado'
    ],
    suporte: 'Suporte instantâneo',
    destaque: false,
  },
];

export function obterPlano(id: string | undefined | null): Plano | undefined {
  return PLANOS.find((plano) => plano.id === id);
}

export function ehPlanoValido(id: string | undefined | null): id is PlanoId {
  return PLANO_IDS.includes(id as PlanoId);
}
