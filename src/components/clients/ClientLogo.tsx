import { cn } from "@/lib/utils";

/**
 * Logo do cliente. Quando não há imagem cadastrada, mostra as iniciais da
 * empresa no mesmo padrão navy da identidade visual.
 */
export function ClientLogo({
  logoUrl,
  initials,
  name,
  className,
}: {
  logoUrl: string | null;
  initials: string;
  name: string;
  className?: string;
}) {
  if (logoUrl) {
    return (
      <span
        className={cn(
          "flex size-10 items-center justify-center overflow-hidden rounded-md border border-border bg-white",
          className,
        )}
      >
        <img src={logoUrl} alt={`Logo de ${name}`} className="size-full object-contain p-1" />
      </span>
    );
  }

  return (
    <span
      aria-hidden
      className={cn(
        "flex size-10 items-center justify-center rounded-md bg-primary text-xs font-semibold text-primary-foreground",
        className,
      )}
    >
      {initials}
    </span>
  );
}
