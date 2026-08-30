export interface EtiquetaSecaoProps {
  children: React.ReactNode;
}

// Etiqueta que antecede o título de cada seção da landing page
export function EtiquetaSecao({ children }: EtiquetaSecaoProps) {
  return (
    <p className="inline-block rounded-full bg-primary-light/20 px-3.5 py-1.5 text-sm font-semibold tracking-wide text-primary-light">
      {children}
    </p>
  );
}
