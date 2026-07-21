/** Camada decorativa fixa de "glow orbs" atrás de todo o app — generaliza o
 * efeito que só existia em public/registro.html pra todas as telas. Server
 * Component (sem interatividade), montado uma vez em app/layout.tsx. */
export default function GlowBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <div className="glow-orb -top-1/4 -left-1/4 h-[60vw] w-[60vw] bg-primary/20 motion-safe:animate-glow-pulse dark:bg-primary/25" />
      <div className="glow-orb top-1/2 -right-1/4 h-[50vw] w-[50vw] bg-violet-500/10 dark:bg-violet-500/15" />
    </div>
  );
}
