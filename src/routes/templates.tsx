import { createFileRoute } from "@tanstack/react-router";
import { Layers, Plus } from "lucide-react";

import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { templates } from "@/data/mock";

export const Route = createFileRoute("/templates")({
  head: () => ({
    meta: [
      { title: "Templates — Central de Inteligência Tributária" },
      {
        name: "description",
        content: "Modelos de apresentação padronizados para diagnósticos e planejamentos fiscais.",
      },
      { property: "og:title", content: "Templates — Central de Inteligência Tributária" },
      {
        property: "og:description",
        content: "Modelos padronizados de apresentação tributária.",
      },
    ],
  }),
  component: Templates,
});

function Templates() {
  return (
    <AppLayout>
      <PageHeader
        title="Templates"
        description="Modelos base para padronizar as apresentações."
        action={
          <Button size="lg">
            <Plus className="size-4" />
            Novo template
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {templates.map((t) => (
          <article key={t.id} className="surface-card overflow-hidden">
            <div className="flex h-24 items-center justify-center bg-primary">
              <span className="h-2 w-16 rounded-full bg-accent" />
            </div>
            <div className="p-5">
              <h3 className="font-display text-base font-semibold">{t.name}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{t.description}</p>
              <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                <Layers className="size-4" />
                {t.slides} slides
              </p>
            </div>
          </article>
        ))}
      </div>
    </AppLayout>
  );
}
