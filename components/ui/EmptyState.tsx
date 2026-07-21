export default function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="glass-card py-12 px-6 text-center">
      <div className="font-bold text-[15px] mb-1.5">{title}</div>
      <div className="text-[13px] text-text-2 max-w-[360px] mx-auto">{description}</div>
    </div>
  );
}
