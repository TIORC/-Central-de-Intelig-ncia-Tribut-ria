import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { FileSpreadsheet, FileText, FileType2, UploadCloud, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FILE_ACCEPT, validateFile } from "@/lib/importers";
import { detectKind } from "@/lib/importers/types";

type FileDropzoneProps = {
  file: File | null;
  onChange: (file: File | null) => void;
  disabled?: boolean;
  error?: string | null;
};

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function iconFor(fileName: string) {
  const kind = detectKind(fileName);
  if (kind === "excel") return FileSpreadsheet;
  if (kind === "word") return FileText;
  if (kind === "pdf") return FileType2;
  return UploadCloud;
}

export function FileDropzone({ file, onChange, disabled, error }: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const accept = (candidate: File | undefined) => {
    if (!candidate) return;
    const invalid = validateFile(candidate);
    if (invalid) {
      setLocalError(invalid);
      onChange(null);
      return;
    }
    setLocalError(null);
    onChange(candidate);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    if (disabled) return;
    accept(event.dataTransfer.files?.[0]);
  };

  const handleInput = (event: ChangeEvent<HTMLInputElement>) => {
    accept(event.target.files?.[0]);
    event.target.value = "";
  };

  const Icon = file ? iconFor(file.name) : UploadCloud;
  const message = error ?? localError;

  return (
    <div className="space-y-2">
      <div
        role="button"
        tabIndex={0}
        aria-label="Importar arquivo para gerar a apresentação"
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            if (!disabled) inputRef.current?.click();
          }
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/30 px-6 py-8 text-center transition",
          dragging && "border-primary bg-primary/5",
          disabled && "cursor-not-allowed opacity-60",
        )}
      >
        <Icon className="size-7 text-muted-foreground" />
        <p className="text-sm font-medium">
          {file ? file.name : "Arraste o arquivo aqui ou clique para selecionar"}
        </p>
        <p className="text-xs text-muted-foreground">
          Excel (.xlsx, .xls, .csv), Word (.docx) e PDF até 15 MB — 1 arquivo por apresentação
        </p>

        <input
          ref={inputRef}
          type="file"
          accept={FILE_ACCEPT}
          className="hidden"
          onChange={handleInput}
          disabled={disabled}
        />
      </div>

      {file && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{file.name}</p>
            <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            title="Remover arquivo"
            disabled={disabled}
            onClick={() => onChange(null)}
          >
            <X className="size-4" />
          </Button>
        </div>
      )}

      {message && <p className="text-xs font-medium text-destructive">{message}</p>}
    </div>
  );
}
