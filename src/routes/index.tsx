import { createFileRoute, Link } from "@tanstack/react-router";
import { FolderOpen, LayoutTemplate, Plus, Presentation, Users } from "lucide-react";

import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { clients, documents, presentations, templates } from "@/data/mock";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Central de Inteligência Tributária" },
      {
        name: "description",
        content:
          "Painel central para apresentações tributárias, clientes, documentos e templates corporativos.",
      },
      { property: "og:title", content: "Dashboard — Central de Inteligência Tributária" },
      {
        property: "og:description",
        content: "Painel central para apresentações tributárias, clientes e documentos.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  return (
    <AppLayout>
      <PageHeader
        title="Dashboard"
        description="Visão geral das apresentações, clientes e materiais da consultoria."
        action={
          <Button asChild size="lg">
            <Link to="/nova-apresentacao">
              <Plus className="size-4" />
              Nova apresentação
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Apresentações"
          value={presentations.length}
          hint="2 aguardando revisão"
          icon={Presentation}
        />
        <StatCard
          label="Clientes"
          value={clients.length}
          hint="Carteira ativa"
          icon={Users}
        />
        <StatCard
          label="Documentos"
          value={documents.length}
          hint="Arquivos vinculados"
          icon={FolderOpen}
        />
        <StatCard
          label="Templates"
          value={templates.length}
          hint="Modelos disponíveis"
          icon={LayoutTemplate}
        />
      </div>

      <section className="surface-card mt-8 overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h3 className="font-display text-base font-semibold">Apresentações recentes</h3>
          <Button asChild variant="ghost" size="sm">
            <Link to="/apresentacoes">Ver todas</Link>
          </Button>
        </div>
        <ul className="divide-y divide-border">
          {presentations.slice(0, 5).map((item) => (
            <li
              key={item.id}
              className="flex flex-wrap items-center gap-3 px-5 py-4 transition-colors hover:bg-muted/50"
            >
              <span className="h-9 w-1 rounded-full bg-accent" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{item.name}</p>
                <p className="text-xs text-muted-foreground">
                  {item.client} · {item.type}
                </p>
              </div>
              <span className="text-xs text-muted-foreground">{item.date}</span>
              <StatusBadge status={item.status} />
              <Button asChild variant="outline" size="sm">
                <Link to="/editor">Abrir</Link>
              </Button>
            </li>
          ))}
        </ul>
      </section>
    </AppLayout>
  );
}
