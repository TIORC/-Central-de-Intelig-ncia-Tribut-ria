import { Image as ImageIcon } from "lucide-react";
import type { CSSProperties } from "react";

import { ChartCardElementView } from "@/components/editor/ChartCardElementView";
import { ChartElementView } from "@/components/editor/ChartElementView";
import { EditableText } from "@/components/editor/EditableText";
import type { EditTarget, ElementTextField, SlideElement } from "@/types/presentation";
import { cn } from "@/lib/utils";

type SlideViewApi = {
  commitEdit?: (text: string) => void;
  cancelEdit?: () => void;
};

type SlideElementViewProps = {
  el: SlideElement;
  editing: EditTarget | null;
  api?: SlideViewApi;
  interactive?: boolean;
};

function isField(target: EditTarget | null, id: string, field: ElementTextField) {
  return target?.id === id && target.field === field;
}

const noop = () => {};

export function SlideElementView({ el, editing, api, interactive = true }: SlideElementViewProps) {
  switch (el.type) {
    case "text": {
      const style: CSSProperties = {
        fontSize: el.fontSize,
        fontWeight: el.fontWeight,
        color: el.color,
        letterSpacing: `${el.letterSpacing}px`,
        textAlign: el.align,
        whiteSpace: "pre-wrap",
        overflowWrap: "break-word",
      };
      return (
        <div className="h-full w-full" data-field="text" style={style}>
          {isField(editing, el.id, "text") ? (
            <EditableText
              value={el.text}
              onCommit={api?.commitEdit ?? noop}
              onCancel={api?.cancelEdit ?? noop}
            />
          ) : (
            <p className="h-full w-full cursor-text">
              {el.text ||
                (interactive ? <span className="opacity-40">Digite um texto…</span> : null)}
            </p>
          )}
        </div>
      );
    }

    case "card": {
      return (
        <div
          className="relative flex h-full w-full flex-col overflow-hidden"
          style={{ background: el.background, borderRadius: el.radius }}
        >
          <div className="h-full w-full space-y-[6px]" style={{ padding: el.padding }}>
            <div
              className="min-h-[1em] cursor-text"
              data-field="title"
              style={{ fontSize: el.titleSize, color: el.titleColor, fontWeight: 700 }}
            >
              {isField(editing, el.id, "title") ? (
                <EditableText
                  value={el.title}
                  singleLine
                  onCommit={api?.commitEdit ?? noop}
                  onCancel={api?.cancelEdit ?? noop}
                />
              ) : (
                <p>
                  {el.title || (interactive ? <span className="opacity-40">Título</span> : null)}
                </p>
              )}
            </div>
            <div
              className="min-h-[1em] flex-1 cursor-text"
              data-field="body"
              style={{ fontSize: el.bodySize, color: el.bodyColor }}
            >
              {isField(editing, el.id, "body") ? (
                <EditableText
                  value={el.body}
                  onCommit={api?.commitEdit ?? noop}
                  onCancel={api?.cancelEdit ?? noop}
                />
              ) : (
                <p className="whitespace-pre-wrap break-words">{el.body}</p>
              )}
            </div>
          </div>
        </div>
      );
    }

    case "stat": {
      return (
        <div
          className="flex h-full w-full flex-col justify-center overflow-hidden"
          style={{ background: el.background, borderRadius: el.radius, padding: el.padding }}
        >
          <div
            className="cursor-text"
            data-field="value"
            style={{ fontSize: el.valueSize, color: el.valueColor, fontWeight: 700 }}
          >
            {isField(editing, el.id, "value") ? (
              <EditableText
                value={el.value}
                singleLine
                onCommit={api?.commitEdit ?? noop}
                onCancel={api?.cancelEdit ?? noop}
              />
            ) : (
              <p className="truncate">
                {el.value || (interactive ? <span className="opacity-40">Valor</span> : null)}
              </p>
            )}
          </div>
          <div
            className="mt-[8px] cursor-text"
            data-field="label"
            style={{ fontSize: el.labelSize, color: el.labelColor }}
          >
            {isField(editing, el.id, "label") ? (
              <EditableText
                value={el.label}
                singleLine
                onCommit={api?.commitEdit ?? noop}
                onCancel={api?.cancelEdit ?? noop}
              />
            ) : (
              <p>{el.label}</p>
            )}
          </div>
        </div>
      );
    }

    case "image": {
      return (
        <div className="h-full w-full overflow-hidden" style={{ borderRadius: el.radius }}>
          {el.src ? (
            <img
              src={el.src}
              alt={el.alt}
              draggable={false}
              className="h-full w-full select-none"
              style={{ objectFit: el.objectFit }}
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-400/60 text-slate-100">
              <ImageIcon className="size-8 opacity-50" />
              <p className="text-sm opacity-50">Imagem (cole a URL no painel)</p>
            </div>
          )}
        </div>
      );
    }

    case "chart": {
      return <ChartElementView el={el} editing={editing} api={api} interactive={interactive} />;
    }

    case "chartCard": {
      return <ChartCardElementView el={el} editing={editing} api={api} interactive={interactive} />;
    }

    case "shape": {
      if (el.kind === "line") {
        return (
          <div className="flex h-full w-full items-center">
            <div className="h-[2px] w-full" style={{ background: el.color }} />
          </div>
        );
      }
      return (
        <div
          className={cn(
            "h-full w-full",
            el.kind === "circle"
              ? "rounded-full"
              : el.kind === "pill"
                ? "rounded-full"
                : "rounded-md",
          )}
          style={{ background: el.color }}
        />
      );
    }
  }
}
