import { EditableText } from "@/components/editor/EditableText";
import { DEFAULT_CHART_THEME } from "@/lib/chart-theme";
import type { ChartCardElement, EditTarget } from "@/types/presentation";
import { cn } from "@/lib/utils";

type CardViewApi =
  | {
      commitEdit?: (text: string) => void;
      cancelEdit?: () => void;
    }
  | undefined;

type ChartCardElementViewProps = {
  el: ChartCardElement;
  editing: EditTarget | null;
  api?: CardViewApi;
  interactive?: boolean;
};

const noop = () => {};

/**
 * Cartão lateral de indicadores: fundo azul-acinzentado escuro, cantos bem
 * arredondados, sem borda, título branco em negrito.
 * Duas leituras: lista (rótulo à esquerda / valor em verde à direita) ou KPIs.
 */
export function ChartCardElementView({
  el,
  editing,
  api,
  interactive = true,
}: ChartCardElementViewProps) {
  const commit = api?.commitEdit ?? noop;
  const cancel = api?.cancelEdit ?? noop;
  const isEditingTitle = editing?.id === el.id && editing.field === "title";
  const hasTitle = Boolean(el.title) || isEditingTitle;

  return (
    <div
      className="flex h-full w-full flex-col overflow-hidden"
      style={{ background: el.background, borderRadius: el.radius, padding: el.padding }}
    >
      {hasTitle ? (
        <div
          className="min-h-[1em] shrink-0 cursor-text"
          data-field="title"
          style={{ fontSize: el.titleSize, color: el.titleColor, fontWeight: 700 }}
        >
          {isEditingTitle ? (
            <EditableText value={el.title} singleLine onCommit={commit} onCancel={cancel} />
          ) : (
            <p className="truncate">{el.title}</p>
          )}
        </div>
      ) : null}

      {el.items.length === 0 ? (
        interactive ? (
          <p className="mt-3 text-xs" style={{ color: DEFAULT_CHART_THEME.card.mutedColor }}>
            Sem indicadores — edite a lista no painel à direita
          </p>
        ) : null
      ) : el.variant === "kpi" ? (
        <div className="mt-4 flex min-h-0 flex-1 flex-col justify-center gap-4">
          {el.items.map((item) => (
            <div key={item.id} className="flex min-w-0 flex-col gap-0.5">
              <span
                className="truncate tracking-wide uppercase"
                style={{
                  fontSize: Math.max(9, el.labelSize - 2),
                  color: el.labelColor,
                }}
              >
                {item.label}
              </span>
              <span
                className="truncate leading-tight font-bold"
                style={{
                  fontSize: Math.round(el.valueSize * (item.emphasis ? 2 : 1.9)),
                  color: item.color ?? el.valueColor,
                }}
              >
                {item.value}
              </span>
              {item.note ? (
                <span
                  className="truncate"
                  style={{
                    fontSize: Math.max(9, el.labelSize - 3),
                    color: DEFAULT_CHART_THEME.card.mutedColor,
                  }}
                >
                  {item.note}
                </span>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <ul className="mt-4 flex min-h-0 flex-1 flex-col gap-2.5">
          {el.items.map((item) => (
            <li
              key={item.id}
              className={cn(
                "flex items-baseline justify-between gap-3",
                item.emphasis && "border-t pt-3",
              )}
              style={item.emphasis ? { borderColor: "rgba(148,163,184,0.25)" } : undefined}
            >
              <span className="truncate" style={{ fontSize: el.labelSize, color: el.labelColor }}>
                {item.label}
              </span>
              <span
                className="shrink-0 text-right font-bold tabular-nums"
                style={{
                  fontSize: item.emphasis ? el.totalSize : el.valueSize,
                  color: item.color ?? el.valueColor,
                }}
              >
                {item.value}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
