// Link invisível até receber foco pelo teclado: leva direto ao conteúdo, sem
// passar por todos os itens do header
export function PularParaConteudo() {
  return (
    <a
      href="#conteudo"
      className="sr-only z-50 rounded-[8px] bg-primary px-4 py-2 text-sm font-medium text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      Pular para o conteúdo
    </a>
  );
}
