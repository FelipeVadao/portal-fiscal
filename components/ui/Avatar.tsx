import { getAvatarColor, getInitials } from "@/lib/format/avatar";

export default function Avatar({ id, nome }: { id: string; nome: string }) {
  return (
    <div
      className="flex items-center justify-center size-[38px] rounded-full shrink-0 text-white text-[13px] font-bold tracking-[0.02em] ring-1 ring-white/10"
      style={{ background: getAvatarColor(id) }}
      aria-hidden="true"
    >
      {getInitials(nome)}
    </div>
  );
}
