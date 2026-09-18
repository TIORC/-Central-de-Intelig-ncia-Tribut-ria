import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Copy,
  Download,
  Play,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { SampleSlide } from "@/components/editor/SampleSlide";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/editor")({
  head: () => ({
    meta: [
      { title: "Editor de apresentação — Central de Inteligência Tributária" },
      {
        name: "description",
        content: "Editor visual de slides com miniaturas, área de edição e painel de propriedades.",
      },
      {
        property: "og:title",
        content: "Editor de apresentação — Central de Inteligência Tributária",
      },
      {
        property: "og:description",
        content: "Editor visual de slides para apresentações tributárias.",
      },
    ],
  }),
  component: Editor,
});

const slides = [
  "Capa institucional",
  "Carga tributária consolidada",
  "Oportunidades identificadas",
  "Plano de ação",
  "Encerramento",
];

function Editor() {
  const [current, setCurrent] = useState(1);

  const soon = (action: string) =>
    toast.info(action, { description: "Função será implementada nas próximas versões." });

  return (
    <div className="flex h-screen flex-col bg-muted/40">
      <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border bg-background px-4">
        <Button asChild variant="ghost" size="sm">
          <Link to="/apresentacoes">
            <ArrowLeft className="size-4" />
            Voltar
          </Link>
        </Button>
        <Separator orientation="vertical" className="h-6" />
        <span className="truncate font-display text-sm font-semibold">
          Diagnóstico Tributário 2026
        </span>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => soon("Adicionar slide")}>
            <Plus className="size-4" />
            Adicionar slide
          </Button>
          <Button variant="outline" size="sm" onClick={() => soon("Duplicar")}>
            <Copy className="size-4" />
            Duplicar
          </Button>
          <Button variant="outline" size="sm" onClick={() => soon("Excluir")}>
            <Trash2 className="size-4" />
            Excluir
          </Button>
          <Button variant="outline" size="sm" onClick={() => soon("Exportar")}>
            <Download className="size-4" />
            Exportar
          </Button>
          <Button variant="outline" size="sm" onClick={() => soon("Apresentar")}>
            <Play className="size-4" />
            Apresentar
          </Button>
          <Button size="sm" onClick={() => soon("Salvar")}>
            <Save className="size-4" />
            Salvar
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-[210px] shrink-0 overflow-y-auto border-r border-border bg-background p-3 lg:block">
          <p className="px-1 pb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Slides
          </p>
          <div className="space-y-2">
            {slides.map((name, i) => (
              <button
                key={name}
                onClick={() => setCurrent(i)}
                className={cn(
                  "w-full text-left",
                  "rounded-md border p-1.5 transition-colors",
                  current === i
                    ? "border-accent bg-accent/10"
                    : "border-border hover:border-primary/40",
                )}
              >
                <div className="aspect-video overflow-hidden rounded-sm bg-primary [container-type:inline-size]">
                  <SampleSlide title={name} />
                </div>
                <p className="mt-1.5 truncate px-0.5 text-[11px] text-muted-foreground">
                  {i + 1}. {name}
                </p>
              </button>
            ))}
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 items-center justify-center overflow-auto p-6">
          <div className="w-full max-w-4xl">
            <div className="aspect-video overflow-hidden rounded-lg shadow-panel [container-type:inline-size]">
              <SampleSlide title={slides[current] ?? "Slide"} />
            </div>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Slide {current + 1} de {slides.length}
            </p>
          </div>
        </section>

        <aside className="hidden w-[288px] shrink-0 overflow-y-auto border-l border-border bg-background p-5 xl:block">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Propriedades
          </p>

          <div className="mt-4 space-y-4">
            <div>
              <Label htmlFor="titulo-slide">Título do slide</Label>
              <Input id="titulo-slide" value={slides[current] ?? ""} readOnly className="mt-2" />
            </div>
            <div>
              <Label htmlFor="layout">Layout</Label>
              <Select defaultValue="indicadores">
                <SelectTrigger id="layout" className="mt-2 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="capa">Capa</SelectItem>
                  <SelectItem value="indicadores">Indicadores</SelectItem>
                  <SelectItem value="texto">Texto</SelectItem>
                  <SelectItem value="grafico">Gráfico</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator className="my-6" />

          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Paleta
          </p>
          <div className="mt-3 space-y-2 text-sm">
            {[
              { name: "Azul-marinho", className: "bg-primary" },
              { name: "Dourado", className: "bg-accent" },
              { name: "Branco", className: "bg-background border border-border" },
            ].map((color) => (
              <div key={color.name} className="flex items-center gap-3">
                <span className={cn("size-6 rounded-md", color.className)} />
                <span className="text-muted-foreground">{color.name}</span>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
