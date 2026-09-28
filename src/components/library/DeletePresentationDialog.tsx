import { TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import { deleteLibraryItem } from "@/lib/library-store";
import { cn } from "@/lib/utils";
import type { LibraryItem } from "@/types/library";

// ---------------------------------------------------------------------------
// Confirmação de exclusão de apresentação (botão de lixeira em /apresentacoes).
// A remoção é definitiva, então o AlertDialog mostra nome, cliente e volume de
// slides antes de apagar o item da biblioteca.
// ---------------------------------------------------------------------------

export function DeletePresentationDialog({
  open,
  onOpenChange,
  item,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: LibraryItem | null;
}) {
  if (!item) return null;

  const handleConfirm = () => {
    const toastId = `delete-presentation-${item.id}`;
    toast.loading("Excluindo apresentação…", {
      id: toastId,
      description: item.name,
    });

    try {
      deleteLibraryItem(item.id);
      toast.success("Apresentação excluída", {
        id: toastId,
        description: `${item.name} saiu da biblioteca.`,
      });
      onOpenChange(false);
    } catch {
      toast.error("Falha ao excluir apresentação", {
        id: toastId,
        description: "Não foi possível excluir a apresentação.",
      });
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <TriangleAlert className="size-5 text-destructive" />
            Excluir apresentação?
          </AlertDialogTitle>
          <AlertDialogDescription>
            <p>
              A apresentação <span className="font-medium text-foreground">{item.name}</span> (
              {item.slideCount} {item.slideCount === 1 ? "slide" : "slides"} · {item.client}) será
              removida em definitivo da biblioteca. Esta ação não pode ser desfeita.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={(event) => {
              event.preventDefault();
              handleConfirm();
            }}
            className={cn(buttonVariants({ variant: "destructive" }))}
          >
            Excluir apresentação
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
