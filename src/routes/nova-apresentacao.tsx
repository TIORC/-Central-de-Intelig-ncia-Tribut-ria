import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2, Sparkles } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { FileDropzone } from "@/components/import/FileDropzone";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { clients, presentationTypes } from "@/data/mock";
import { importPresentation } from "@/lib/importers";
import { createLibraryItem } from "@/lib/library-store";
import { newPresentation } from "@/lib/presentation-factory";
import { todayISO } from "@/types/library";
import type { Presentation } from "@/types/presentation";

export const Route = createFileRoute("/nova-apresentacao")({
  head: () => ({
    meta: [
      { title: "Nova apresentação — Central de Inteligência Tributária" },
      {
        name: "description",
        content: "Cadastre os dados iniciais de uma nova apresentação para o cliente.",
      },
      { property: "og:title", content: "Nova apresentação — Central de Inteligência Tributária" },
      {
        property: "og:description",
        content: "Cadastre os dados iniciais de uma nova apresentação.",
      },
    ],
  }),
  component: NewPresentation,
});

function NewPresentation() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [clienteId, setClienteId] = useState("");
  const [tipo, setTipo] = useState("");
  const [dataISO, setDataISO] = useState("");
  const [descricao, setDescricao] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setImporting(true);

    try {
      const nome =
        name.trim() || (file ? file.name.replace(/\.[a-z0-9]+$/i, "") : "Nova apresentação");

      let presentation: Presentation;
      let sourceFile: string | undefined;
      let warning: string | undefined;

      if (file) {
        const outcome = await importPresentation(file, { nome });
        presentation = outcome.presentation;
        sourceFile = outcome.result.sourceFile;
        warning = outcome.result.warning;
      } else {
        presentation = newPresentation(nome);
      }

      const item = createLibraryItem({
        name: nome,
        client: clients.find((c) => c.id === clienteId)?.name ?? "Não informado",
        type: tipo || "Planejamento",
        status: "Rascunho",
        dateISO: dataISO || todayISO(),
        presentation,
        ...(sourceFile ? { sourceFile } : {}),
        ...(descricao.trim() ? { description: descricao.trim() } : {}),
      });

      toast.success(
        file ? `${presentation.slides.length} slides gerados` : "Apresentação criada",
        {
          description:
            warning ??
            (file
              ? `${item.name} está na lista de apresentações. Abrindo o editor…`
              : `${item.name} já aparece na lista de apresentações.`),
        },
      );

      await (file
        ? navigate({ to: "/editor", search: { id: item.id } })
        : navigate({ to: "/apresentacoes" }));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Não foi possível converter o arquivo.";
      setError(message);
      toast.error("Falha na importação", { description: message });
    } finally {
      setImporting(false);
    }
  };

  return (
    <AppLayout>
      <PageHeader
        title="Nova apresentação"
        description="Defina as informações básicas ou importe um arquivo para gerar os slides automaticamente."
      />

      <form onSubmit={handleSubmit} className="surface-card max-w-3xl p-6 md:p-8">
        <div className="grid gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <Label htmlFor="nome">Nome da apresentação</Label>
            <Input
              id="nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Diagnóstico Tributário 2026"
              className="mt-2"
              disabled={importing}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Em branco usamos o nome do arquivo importado.
            </p>
          </div>

          <div>
            <Label htmlFor="cliente">Cliente</Label>
            <Select value={clienteId} onValueChange={setClienteId} disabled={importing}>
              <SelectTrigger id="cliente" className="mt-2 w-full">
                <SelectValue placeholder="Selecione o cliente" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="tipo">Tipo da apresentação</Label>
            <Select value={tipo} onValueChange={setTipo} disabled={importing}>
              <SelectTrigger id="tipo" className="mt-2 w-full">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {presentationTypes.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="data">Data</Label>
            <Input
              id="data"
              type="date"
              className="mt-2"
              value={dataISO}
              onChange={(e) => setDataISO(e.target.value)}
              disabled={importing}
            />
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              rows={5}
              placeholder="Objetivo da apresentação, escopo e observações internas."
              className="mt-2"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              disabled={importing}
            />
          </div>

          <div className="md:col-span-2">
            <div className="mb-2 flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              <Label htmlFor="arquivo">Importar arquivo e gerar os slides</Label>
            </div>
            <FileDropzone
              file={file}
              onChange={(next) => {
                setError(null);
                setFile(next);
              }}
              disabled={importing}
              error={error}
            />
            <p className="mt-2 text-xs text-muted-foreground">
              Planilhas de planejamento tributário viram 10 slides na identidade Lumina (capa,
              receita, regimes, comparativo e economia). Word e PDF geram uma apresentação genérica
              a partir do texto extraído.
            </p>
          </div>
        </div>

        <div className="mt-7 flex flex-wrap gap-3 border-t border-border pt-6">
          <Button type="submit" size="lg" disabled={importing}>
            {importing && <Loader2 className="size-4 animate-spin" />}
            {importing
              ? "Convertendo arquivo…"
              : file
                ? "Converter e abrir no editor"
                : "Criar apresentação"}
          </Button>
          <Button
            type="reset"
            variant="outline"
            size="lg"
            disabled={importing}
            onClick={() => {
              setName("");
              setClienteId("");
              setTipo("");
              setDataISO("");
              setDescricao("");
              setFile(null);
              setError(null);
            }}
          >
            Limpar
          </Button>
        </div>
      </form>
    </AppLayout>
  );
}
