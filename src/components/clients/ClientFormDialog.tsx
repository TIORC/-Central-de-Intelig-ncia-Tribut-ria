import { zodResolver } from "@hookform/resolvers/zod";
import { ImagePlus, Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import {
  clientToFormValues,
  clientFormSchema,
  EMPTY_FORM,
  type ClientFormValues,
} from "@/components/clients/client-form";
import { ClientLogo } from "@/components/clients/ClientLogo";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateClient, useUpdateClient } from "@/hooks/use-clients";
import { MAX_LOGO_BYTES } from "@/lib/client-store";
import {
  CLIENT_SEGMENTS,
  clientInitials,
  formatCnpj,
  onlyDigits,
  type Client,
} from "@/types/client";

// ---------------------------------------------------------------------------
// Formulário de cliente usado tanto na inscrição ("Novo cliente") quanto na
// edição de uma linha já existente. As duas telas gravam as mesmas colunas de
// `public.clients` e compartilham validação, máscaras e upload de logo, então
// tudo vive aqui e o modo só troca rótulos, valores iniciais e mutation.
// ---------------------------------------------------------------------------

type ClientFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  /** Cliente em edição. Obrigatório quando `mode` é "edit". */
  client?: Client | null;
};

export function ClientFormDialog({ open, onOpenChange, mode, client }: ClientFormDialogProps) {
  const isEdit = mode === "edit" && Boolean(client);
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();
  const isPending = createClient.isPending || updateClient.isPending;

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  /** Marca a logo já salva para remoção (modo edit, sem arquivo novo). */
  const [removeLogo, setRemoveLogo] = useState(false);

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: EMPTY_FORM,
  });

  // Object URL da logo escolhida — revogado quando troca ou o modal fecha.
  useEffect(() => {
    if (!logoFile) {
      setLogoPreview(null);
      return;
    }
    const url = URL.createObjectURL(logoFile);
    setLogoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [logoFile]);

  // Trocar de linha (ou reabrir) precisa recarregar os valores: sem isso o
  // modal herdaria as edições de quem estava aberto antes.
  useEffect(() => {
    if (!open) return;
    form.reset(isEdit && client ? clientToFormValues(client) : EMPTY_FORM);
    setLogoFile(null);
    setRemoveLogo(false);
  }, [open, isEdit, client, form]);

  const handleOpenChange = (next: boolean) => {
    if (isPending) return;
    if (!next) {
      form.reset(EMPTY_FORM);
      setLogoFile(null);
      setRemoveLogo(false);
    }
    onOpenChange(next);
  };

  const watchName = form.watch("name");
  const watchLegalName = form.watch("legalName");

  // Sem arquivo novo: mostra a logo do banco, ou nada se ela foi removida.
  const currentLogo = logoFile ? logoPreview : removeLogo ? null : (client?.logoUrl ?? logoPreview);

  const hasLogo = Boolean(currentLogo) || Boolean(logoFile);
  const pendingLogoUrl = client?.logoUrl ?? null;

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";

    if (!file) return;
    if (!file.type.startsWith("image/")) {
      form.setError("root", { message: "Selecione um arquivo de imagem (PNG, JPG, WEBP ou SVG)." });
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      form.setError("root", { message: "A logo deve ter no máximo 2 MB." });
      return;
    }

    form.clearErrors("root");
    setLogoFile(file);
    setRemoveLogo(false);
  };

  const clearLogo = () => {
    setLogoFile(null);
    setRemoveLogo(true);
    form.clearErrors("root");
  };

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      if (isEdit && client) {
        const updated = await updateClient.mutateAsync({
          id: client.id,
          previousLogoUrl: pendingLogoUrl,
          removeLogo,
          logoFile,
          ...values,
        });
        toast.success("Cliente atualizado", {
          description: `${updated.legalName} teve os dados atualizados.`,
        });
      } else {
        const created = await createClient.mutateAsync({ ...values, logoFile });
        toast.success("Cliente cadastrado", {
          description: `${created.legalName} entrou na carteira de clientes.`,
        });
      }
      handleOpenChange(false);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : isEdit
            ? "Não foi possível salvar o cliente."
            : "Não foi possível cadastrar o cliente.";
      form.setError("root", { message });
      toast.error(isEdit ? "Falha ao salvar cliente" : "Falha ao cadastrar cliente", {
        description: message,
      });
    }
  });

  const rootError = form.formState.errors.root?.message;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader className="text-left">
          <DialogTitle className="font-display">
            {isEdit ? "Editar cliente" : "Novo cliente"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Atualização dos dados da empresa atendida pela consultoria."
              : "Inscrição da empresa atendida pela consultoria. Campos com * são obrigatórios."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-5">
            {/* Logo --------------------------------------------------- */}
            <div className="flex flex-wrap items-center gap-4 rounded-lg border border-border bg-muted/30 p-4">
              <ClientLogo
                logoUrl={currentLogo}
                initials={clientInitials(watchName, watchLegalName)}
                name={watchLegalName || watchName || "Cliente"}
                className="size-16 text-sm"
              />
              <div className="min-w-[200px] flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Button type="button" variant="outline" size="sm" asChild>
                    <label htmlFor="client-logo" className="cursor-pointer">
                      <ImagePlus className="size-4" />
                      {logoFile ? "Trocar logo" : "Escolher logo"}
                    </label>
                  </Button>
                  {hasLogo && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={clearLogo}
                      disabled={isPending}
                    >
                      <X className="size-4" />
                      Remover
                    </Button>
                  )}
                </div>
                <input
                  id="client-logo"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="sr-only"
                  onChange={handleLogoChange}
                  disabled={isPending}
                />
                <p className="text-xs text-muted-foreground">
                  {logoFile
                    ? `${logoFile.name} · ${(logoFile.size / 1024).toFixed(0)} KB`
                    : removeLogo
                      ? "A logo atual será removida ao salvar."
                      : "PNG, JPG, WEBP ou SVG · até 2 MB. Sem logo, exibimos as iniciais."}
                </p>
              </div>
            </div>

            {/* Identificação ------------------------------------------ */}
            <FormField
              control={form.control}
              name="legalName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Razão Social *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Alpha Indústria de Componentes S.A."
                      autoComplete="organization"
                      disabled={isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-5 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome fantasia</FormLabel>
                    <FormControl>
                      <Input placeholder="Alpha Indústria" disabled={isPending} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cnpj"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CNPJ *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="00.000.000/0000-00"
                        inputMode="numeric"
                        disabled={isPending}
                        {...field}
                        onChange={(event) => field.onChange(formatCnpj(event.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Segmento ---------------------------------------------- */}
            <FormField
              control={form.control}
              name="segment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Segmento *</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange} disabled={isPending}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o segmento de atuação" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CLIENT_SEGMENTS.map((segment) => (
                        <SelectItem key={segment} value={segment}>
                          {segment}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Contato ----------------------------------------------- */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="contato@empresa.com.br"
                      autoComplete="email"
                      disabled={isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-5 sm:grid-cols-[120px_1fr]">
              <FormField
                control={form.control}
                name="phoneDdd"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>DDD</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="11"
                        inputMode="numeric"
                        maxLength={2}
                        disabled={isPending}
                        {...field}
                        onChange={(event) =>
                          field.onChange(onlyDigits(event.target.value).slice(0, 2))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone / contato</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="99999-0000"
                        inputMode="tel"
                        maxLength={9}
                        disabled={isPending}
                        {...field}
                        onChange={(event) =>
                          field.onChange(onlyDigits(event.target.value).slice(0, 9))
                        }
                      />
                    </FormControl>
                    <FormDescription>Número com 8 ou 9 dígitos, sem o DDD.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {rootError && (
              <p className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {rootError}
              </p>
            )}

            <DialogFooter className="gap-2 border-t border-border pt-5">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="size-4 animate-spin" />}
                {isPending
                  ? isEdit
                    ? "Salvando…"
                    : "Cadastrando…"
                  : isEdit
                    ? "Salvar"
                    : "Cadastrar cliente"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
