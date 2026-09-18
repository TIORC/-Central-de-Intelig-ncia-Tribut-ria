import { cn } from "@/lib/utils";
import type { PresentationStatus } from "@/data/mock";

const styles: Record<PresentationStatus, string> = {
  Finalizada: "bg-success/10 text-success",
  "Em revisão": "bg-accent/20 text-accent-foreground",
  Rascunho: "bg-secondary text-muted-foreground",
};

export function StatusBadge({ status }: { status: PresentationStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        styles[status],
      )}
    >
      {status}
    </span>
  );
}
