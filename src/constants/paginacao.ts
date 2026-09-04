export const ITENS_POR_PAGINA = 10;

// Converte o parâmetro de busca em número de página válido
export function paginaDaBusca(valor: string | string[] | undefined): number {
  const bruto = Array.isArray(valor) ? valor[0] : valor;
  const numero = Number(bruto);

  return Number.isInteger(numero) && numero > 0 ? numero : 1;
}

// Intervalo aceito pelo .range() do PostgREST
export function intervaloDaPagina(pagina: number, porPagina = ITENS_POR_PAGINA) {
  const de = (pagina - 1) * porPagina;

  return { de, ate: de + porPagina - 1 };
}
