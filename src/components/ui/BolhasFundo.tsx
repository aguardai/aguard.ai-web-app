// Bolhas flutuantes decorativas para fundos em gradiente
export function BolhasFundo() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="bolha absolute -top-24 -left-16 size-[26rem] rounded-full bg-white/25 blur-2xl" />
      <div className="bolha-lenta absolute -top-16 right-0 size-[30rem] rounded-full bg-primary/70 blur-2xl" />
      <div className="bolha absolute -bottom-32 left-1/3 size-[28rem] rounded-full bg-primary-light/80 blur-2xl" />
      <div className="bolha-lenta absolute bottom-0 -left-24 size-[22rem] rounded-full bg-white/20 blur-2xl" />
    </div>
  );
}
