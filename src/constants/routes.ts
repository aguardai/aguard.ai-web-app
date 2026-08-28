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
}

// Rotas autenticadas com controle de acesso por perfil
export const AUTH_ROUTES: RouteConfig[] = [
  // --- Dashboard ---
  {
    path: '/dashboard',
    label: 'Dashboard',
    roles: ['CLINICA', 'UNIDADE'],
    showInSidebar: true,
  },

  // --- Gestão da Clínica ---
  {
    path: '/clinica',
    label: 'Minha Clínica',
    roles: ['CLINICA'],
    showInSidebar: true,
  },

  // --- Unidades ---
  {
    path: '/unidades',
    label: 'Unidades',
    roles: ['CLINICA'],
    showInSidebar: true,
  },
  {
    path: '/unidades/nova',
    label: 'Nova Unidade',
    roles: ['CLINICA'],
    showInSidebar: false,
  },
  {
    path: '/unidades/:id',
    label: 'Ver Unidade',
    roles: ['CLINICA'],
    showInSidebar: false,
  },
  {
    path: '/unidades/:id/editar',
    label: 'Editar Unidade',
    roles: ['CLINICA'],
    showInSidebar: false,
  },

  // --- Profissionais ---
  {
    path: '/profissionais',
    label: 'Profissionais',
    roles: ['CLINICA', 'UNIDADE'],
    showInSidebar: true,
  },
  {
    path: '/profissionais/novo',
    label: 'Novo Profissional',
    roles: ['CLINICA', 'UNIDADE'],
    showInSidebar: false,
  },
  {
    path: '/profissionais/:id',
    label: 'Ver Profissional',
    roles: ['CLINICA', 'UNIDADE'],
    showInSidebar: false,
  },
  {
    path: '/profissionais/:id/editar',
    label: 'Editar Profissional',
    roles: ['CLINICA', 'UNIDADE'],
    showInSidebar: false,
  },

  // --- Locações ---
  {
    path: '/locacoes',
    label: 'Locações',
    roles: ['CLINICA'],
    showInSidebar: true,
  },

  // --- Filas ---
  {
    path: '/filas',
    label: 'Filas',
    roles: ['CLINICA', 'UNIDADE'],
    showInSidebar: true,
  },

  // --- Atendimento (Profissional) ---
  {
    path: '/atendimento',
    label: 'Minha Fila',
    roles: ['PROFISSIONAL', 'UNIDADE'],
    showInSidebar: true,
  },
  {
    path: '/atendimento/historico',
    label: 'Histórico',
    roles: ['PROFISSIONAL', 'UNIDADE'],
    showInSidebar: true,
  },

  // --- Relatórios ---
  {
    path: '/relatorios',
    label: 'Relatórios',
    roles: ['CLINICA', 'UNIDADE'],
    showInSidebar: true,
  },
];

// Rotas públicas (não requerem autenticação)
export const PUBLIC_ROUTES: Omit<RouteConfig, 'roles' | 'showInSidebar'>[] = [
  {
    path: '/',
    label: 'Landing Page',
  },
  {
    path: '/fila/:guicheId',
    label: 'Entrada na Fila do Guichê',
  },
  {
    path: '/acompanhar/:ticketId',
    label: 'Acompanhamento da Fila em Tempo Real',
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
