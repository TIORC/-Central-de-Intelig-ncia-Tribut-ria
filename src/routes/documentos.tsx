import { createFileRoute } from "@tanstack/react-router";
import { FileText, Upload } from "lucide-react";

import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { documents } from "@/data/mock";

export const Route = createFileRoute("/documentos")({
  head: () => ({
    meta: [
      { title: "Documentos — Central de Inteligência Tributária" },
      {
        name: "description",
        content: "Documentos e planilhas vinculados a cada cliente da consultoria tributária.",
      },
      { property: "og:title", content: "Documentos — Central de Inteligência Tributária" },
      {
        property: "og:description",
        content: "Documentos e planilhas vinculados a cada cliente.",
      },
    ],
  }),
  component: Documents,
});

function Documents() {
  return (
    <AppLayout>
      <PageHeader
        title="Documentos"
        description="Arquivos de apoio organizados por cliente."
        action={
          <Button size="lg">
            <Upload className="size-4" />
            Enviar documento
          </Button>
        }
      />

      <div className="surface-card divide-y divide-border">
        {documents.map((doc) => (
          <div key={doc.id} className="flex items-center gap-4 px-5 py-4">
            <span className="flex size-10 items-center justify-center rounded-md bg-secondary text-primary">
              <FileText className="size-[18px]" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{doc.name}</p>
              <p className="text-xs text-muted-foreground">
                {doc.client} · {doc.kind}
              </p>
            </div>
            <span className="text-xs text-muted-foreground">{doc.date}</span>
            <Button variant="ghost" size="sm">
              Abrir
            </Button>
          </div>
        ))}
      </div>
    </AppLayout>
  );
}
