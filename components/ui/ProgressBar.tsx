export default function ProgressBar({ percent }: { percent: number }) {
  const clamped = Math.min(100, Math.max(0, percent));
  return (
    <div
      className="flex-1 h-2 bg-surface-2 border border-border rounded-full overflow-hidden"
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full transition-[width] duration-200 bg-gradient-to-r from-primary to-violet-400"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
