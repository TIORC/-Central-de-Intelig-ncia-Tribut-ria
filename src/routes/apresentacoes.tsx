import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, Plus, Presentation } from "lucide-react";

import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { useLibrary } from "@/hooks/use-library";
import { formatLibraryDate } from "@/types/library";

export const Route = createFileRoute("/apresentacoes")({
  head: () => ({
    meta: [
      { title: "Apresentações — Central de Inteligência Tributária" },
      {
        name: "description",
        content: "Acompanhe todas as apresentações tributárias por cliente, data e status.",
      },
      { property: "og:title", content: "Apresentações — Central de Inteligência Tributária" },
      {
        property: "og:description",
        content: "Acompanhe apresentações por cliente, data e status.",
      },
    ],
  }),
  component: Presentations,
});

function EmptyState() {
  return (
    <div className="surface-card flex flex-col items-center gap-3 px-6 py-14 text-center">
      <Presentation className="size-8 text-muted-foreground" />
      <h3 className="font-display text-base font-semibold">Nenhuma apresentação ainda</h3>
      <p className="max-w-md text-sm text-muted-foreground">
        Importe uma planilha, um documento do Word ou um PDF: a apresentação é gerada e aparece
        nesta lista automaticamente.
      </p>
      <Button asChild size="lg" className="mt-2">
        <Link to="/nova-apresentacao">
          <Plus className="size-4" />
          Nova apresentação
        </Link>
      </Button>
    </div>
  );
}

function Presentations() {
  const items = useLibrary();

  return (
    <AppLayout>
      <PageHeader
        title="Apresentações"
        description="Todas as apresentações da carteira, organizadas por cliente."
        action={
          <Button asChild size="lg">
            <Link to="/nova-apresentacao">
              <Plus className="size-4" />
              Nova apresentação
            </Link>
          </Button>
        }
      />

      {items.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <article key={item.id} className="surface-card flex flex-col overflow-hidden">
              <div className="flex h-28 items-end justify-between bg-primary p-4">
                <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground">
                  {item.type}
                </span>
                <span className="text-xs text-primary-foreground/70">
                  {item.slideCount} {item.slideCount === 1 ? "slide" : "slides"}
                </span>
              </div>
              <div className="flex flex-1 flex-col p-5">
                <h3 className="font-display text-base font-semibold">{item.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{item.client}</p>
                {item.sourceFile && (
                  <p className="mt-1 truncate text-xs text-muted-foreground">{item.sourceFile}</p>
                )}
                <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                  <CalendarDays className="size-4" />
                  {formatLibraryDate(item.dateISO)}
                </div>
                <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
                  <StatusBadge status={item.status} />
                  <Button asChild variant="outline" size="sm">
                    <Link to="/editor" search={{ id: item.id }}>
                      Abrir editor
                    </Link>
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
