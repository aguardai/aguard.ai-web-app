// Definição de rotas e permissões de acesso por perfil

export const ROLES = {
  CLINICA: 'CLINICA',
  UNIDADE: 'UNIDADE',
  PROFISSIONAL: 'PROFISSIONAL',
  PACIENTE: 'PACIENTE',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export interface RouteConfig {
  path: string;
  label: string;
  roles: Role[];
  showInSidebar: boolean;
  carregando: string;
}

// Rotas autenticadas com controle de acesso por perfil
export const AUTH_ROUTES: RouteConfig[] = [
  // --- Dashboard ---
  {
    path: '/dashboard',
    label: 'Dashboard',
    carregando: 'Carregando o painel...',
    roles: ['CLINICA', 'UNIDADE'],
    showInSidebar: true,
  },

  // --- Gestão da Clínica ---
  {
    path: '/clinica',
    label: 'Minha Clínica',
    carregando: 'Carregando os dados da clínica...',
    roles: ['CLINICA'],
    showInSidebar: true,
  },

  // --- Unidades ---
  {
    path: '/unidades',
    label: 'Unidades',
    carregando: 'Carregando as unidades...',
    roles: ['CLINICA'],
    showInSidebar: true,
  },
  {
    path: '/unidades/nova',
    label: 'Nova Unidade',
    carregando: 'Abrindo o cadastro de unidade...',
    roles: ['CLINICA'],
    showInSidebar: false,
  },
  {
    path: '/unidades/:id',
    label: 'Ver Unidade',
    carregando: 'Carregando a unidade...',
    roles: ['CLINICA'],
    showInSidebar: false,
  },
  {
    path: '/unidades/:id/editar',
    label: 'Editar Unidade',
    carregando: 'Carregando a unidade...',
    roles: ['CLINICA'],
    showInSidebar: false,
  },
  {
    path: '/guiches',
    label: 'Guichês',
    carregando: 'Carregando os guichês...',
    roles: ['CLINICA', 'UNIDADE'],
    showInSidebar: true,
  },

  // --- Profissionais ---
  {
    path: '/profissionais',
    label: 'Profissionais',
    carregando: 'Carregando os profissionais...',
    roles: ['CLINICA', 'UNIDADE'],
    showInSidebar: true,
  },
  {
    path: '/profissionais/novo',
    label: 'Novo Profissional',
    carregando: 'Abrindo o cadastro de profissional...',
    roles: ['CLINICA'],
    showInSidebar: false,
  },
  {
    path: '/profissionais/:id',
    label: 'Ver Profissional',
    carregando: 'Carregando o profissional...',
    roles: ['CLINICA', 'UNIDADE'],
    showInSidebar: false,
  },
  {
    path: '/profissionais/:id/editar',
    label: 'Editar Profissional',
    carregando: 'Carregando o profissional...',
    roles: ['CLINICA'],
    showInSidebar: false,
  },

  // --- Locações ---
  {
    path: '/locacoes',
    label: 'Locações',
    carregando: 'Carregando as locações...',
    roles: ['CLINICA'],
    showInSidebar: true,
  },

  // --- Filas ---
  {
    path: '/filas',
    label: 'Filas',
    carregando: 'Carregando as filas...',
    roles: ['CLINICA', 'UNIDADE'],
    showInSidebar: true,
  },

  // --- Atendimento (Profissional) ---
  {
    path: '/atendimento',
    label: 'Minha Fila',
    carregando: 'Carregando a sua fila...',
    roles: ['PROFISSIONAL'],
    showInSidebar: true,
  },
  {
    path: '/atendimento/historico',
    label: 'Histórico',
    carregando: 'Carregando o histórico...',
    roles: ['PROFISSIONAL'],
    showInSidebar: true,
  },

  // --- Relatórios ---
  {
    path: '/relatorios',
    label: 'Relatórios',
    carregando: 'Carregando os relatórios...',
    roles: ['CLINICA', 'UNIDADE'],
    showInSidebar: true,
  },
];

// Rotas públicas (não requerem autenticação)
export const PUBLIC_ROUTES: Omit<
  RouteConfig,
  'roles' | 'showInSidebar' | 'carregando'
>[] = [
    {
      path: '/',
      label: 'Landing Page',
    },
    {
      path: '/fila/:unidadeId',
      label: 'Entrada na Fila da Unidade',
    },
    {
      path: '/acompanhar/:ticketId',
      label: 'Acompanhamento da Fila em Tempo Real',
    },
    {
      path: '/painel/:unidadeId',
      label: 'Painel da Sala de Espera',
    },
    {
      path: '/login',
      label: 'Entrar',
    },
    {
      path: '/cadastro',
      label: 'Cadastro da Clínica',
    },
    {
      path: '/pagamento-pendente',
      label: 'Pagamento em Aberto',
    },
  ];

// Retorna as rotas de sidebar filtradas por perfil
export function getSidebarRoutes(role: Role): RouteConfig[] {
  return AUTH_ROUTES.filter(
    (route) => route.showInSidebar && route.roles.includes(role)
  );
}

// Verifica se um perfil tem acesso a uma rota
export function hasAccess(role: Role, path: string): boolean {
  const route = AUTH_ROUTES.find((r) => r.path === path);
  if (!route) return false;
  return route.roles.includes(role);
}

export const MENSAGEM_CARREGAMENTO_PADRAO = 'Carregando...';

function especificidade(padrao: string, caminho: string): number {
  const segmentosPadrao = padrao.split('/');
  const segmentos = caminho.split('/');

  if (segmentosPadrao.length !== segmentos.length) {
    return 0;
  }

  let pontos = 0;

  for (let indice = 0; indice < segmentos.length; indice += 1) {
    if (segmentosPadrao[indice].startsWith(':')) {
      pontos += 1;
    } else if (segmentosPadrao[indice] === segmentos[indice]) {
      pontos += 2;
    } else {
      return 0;
    }
  }

  return pontos;
}

// Frase de carregamento da rota aberta, usada pelo loading.tsx do grupo
export function mensagemDeCarregamento(caminho: string): string {
  const escolhida = AUTH_ROUTES.reduce<{ pontos: number; rota?: RouteConfig }>(
    (melhor, rota) => {
      const pontos = especificidade(rota.path, caminho);

      return pontos > melhor.pontos ? { pontos, rota } : melhor;
    },
    { pontos: 0 }
  );

  return escolhida.rota?.carregando ?? MENSAGEM_CARREGAMENTO_PADRAO;
}
