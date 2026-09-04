// Contrato das listagens paginadas no servidor

export interface Pagina<T> {
  itens: T[];
  total: number;
}

export interface ParametrosPagina {
  pagina: number;
  porPagina: number;
}
