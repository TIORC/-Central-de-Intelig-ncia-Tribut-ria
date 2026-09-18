import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
}) {
  return (
    <div className="surface-card p-5">
      <div className="flex items-start justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="flex size-9 items-center justify-center rounded-md bg-secondary text-primary">
          <Icon className="size-[18px]" />
        </span>
      </div>
      <p className="mt-4 font-display text-3xl font-semibold">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
