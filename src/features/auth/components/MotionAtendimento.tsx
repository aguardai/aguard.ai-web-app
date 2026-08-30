import { Stethoscope } from 'lucide-react';

// Ilustração animada do painel de autenticação: anéis de chamada, flutuação e traçado de ECG
export function MotionAtendimento() {
  return (
    <div aria-hidden className="relative flex size-44 items-center justify-center">
      <span className="motion-anel absolute inset-0 rounded-full border border-white/40" />
      <span className="motion-anel absolute inset-0 rounded-full border border-white/40 [animation-delay:1s]" />
      <span className="motion-anel absolute inset-0 rounded-full border border-white/40 [animation-delay:2s]" />

      <span className="motion-flutua flex size-24 items-center justify-center rounded-full bg-white/15">
        <Stethoscope className="size-11 text-white" />
      </span>

      <svg
        viewBox="0 0 200 28"
        fill="none"
        className="absolute -bottom-4 w-52"
        role="presentation"
      >
        <polyline
          className="motion-ecg"
          points="0,14 44,14 52,5 60,23 68,14 112,14 120,6 128,22 136,14 200,14"
          stroke="rgba(255,255,255,0.75)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
