import { useEffect, useState } from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowDownToLine,
  ArrowUpToLine,
  Trash2,
} from "lucide-react";

import { PALETTE } from "@/data/slide-templates";
import type { EditorApi } from "@/hooks/use-presentation";
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
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import type {
  ElementAlign,
  ElementFontWeight,
  ShapeKind,
  SlideElement,
} from "@/types/presentation";
import { SLIDE_HEIGHT, SLIDE_WIDTH } from "@/types/presentation";
import { cn } from "@/lib/utils";

type InspectorPanelProps = {
  api: EditorApi;
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{title}</p>
      {children}
    </div>
  );
}

function DraftInput({
  value,
  onCommit,
  multiline = false,
}: {
  value: string;
  onCommit: (v: string) => void;
  multiline?: boolean;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  const commit = () => {
    if (draft !== value) onCommit(draft);
  };
  const shared = {
    value: draft,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setDraft(e.target.value),
    onBlur: commit,
  };
  if (multiline) return <Textarea {...shared} rows={3} className="mt-2 resize-none" />;
  return (
    <Input
      {...shared}
      className="mt-2"
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
      }}
    />
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  step = 1,
  onCommit,
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onCommit: (v: number) => void;
}) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);
  const commit = () => {
    const n = Number(draft);
    if (!Number.isFinite(n)) {
      setDraft(String(value));
      return;
    }
    const clamped = Math.min(
      max ?? Number.POSITIVE_INFINITY,
      Math.max(min ?? Number.NEGATIVE_INFINITY, n),
    );
    onCommit(clamped);
    setDraft(String(clamped));
  };
  return (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input
        type="number"
        min={min}
        max={max}
        step={step}
        value={draft}
        className="mt-1"
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
      />
    </div>
  );
}

const COLOR_SWATCHES = [
  PALETTE.primary,
  PALETTE.navy,
  PALETTE.gold,
  PALETTE.white,
  PALETTE.ink,
  PALETTE.muted,
  PALETTE.soft,
  PALETTE.green,
  PALETTE.red,
  "rgba(255,255,255,0.10)",
];

function ColorField({
  label,
  value,
  onCommit,
}: {
  label: string;
  value: string;
  onCommit: (v: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  return (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {COLOR_SWATCHES.map((swatch) => (
          <button
            key={swatch}
            type="button"
            onClick={() => onCommit(swatch)}
            className={cn(
              "size-5 rounded-full ring-1 ring-black/10 transition-transform hover:scale-110",
              value === swatch && "ring-2 ring-primary",
            )}
            style={{ background: swatch }}
          />
        ))}
      </div>
      <Input
        value={draft}
        className="mt-2 font-mono text-xs"
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => onCommit(draft)}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
      />
    </div>
  );
}

function AlignField({
  value,
  onCommit,
}: {
  value: ElementAlign;
  onCommit: (v: ElementAlign) => void;
}) {
  const options = [
    { value: "left" as const, icon: AlignLeft, label: "Esquerda" },
    { value: "center" as const, icon: AlignCenter, label: "Centro" },
    { value: "right" as const, icon: AlignRight, label: "Direita" },
  ];
  return (
    <div>
      <Label className="text-xs text-muted-foreground">Alinhamento</Label>
      <div className="mt-1.5 flex gap-1">
        {options.map((o) => (
          <Button
            key={o.value}
            type="button"
            size="icon"
            variant={value === o.value ? "default" : "outline"}
            className="h-8 w-9"
            title={o.label}
            onClick={() => onCommit(o.value)}
          >
            <o.icon className="size-4" />
          </Button>
        ))}
      </div>
    </div>
  );
}

function SelectField<T extends string | number>({
  label,
  value,
  options,
  onCommit,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onCommit: (v: T) => void;
}) {
  return (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Select value={String(value)} onValueChange={(v) => onCommit(v as T)}>
        <SelectTrigger className="mt-1 h-8 w-full text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={String(o.value)} value={String(o.value)}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function InspectorPanel({ api }: InspectorPanelProps) {
  const { currentSlide, currentIndex, selectedElementId } = api;
  const element = currentSlide.elements.find((el) => el.id === selectedElementId) ?? null;
  const bg = currentSlide.background;

  const patch = (p: Partial<SlideElement>) => {
    if (element) api.updateElement(element.id, p, true);
  };

  if (!element) {
    return (
      <div className="space-y-6 p-4">
        <Section title="Slide">
          <div>
            <Label htmlFor="slide-name" className="text-xs text-muted-foreground">
              Nome do slide
            </Label>
            <DraftInput
              value={currentSlide.name}
              onCommit={(v) => api.renameSlide(currentIndex, v)}
            />
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Fundo</Label>
            <div className="mt-1.5 flex gap-1">
              <Button
                type="button"
                size="sm"
                variant={currentSlide.background.type === "solid" ? "default" : "outline"}
                className="h-8 flex-1 text-xs"
                onClick={() =>
                  api.setSlideBackground(currentIndex, {
                    type: "solid",
                    color:
                      currentSlide.background.type === "solid"
                        ? currentSlide.background.color
                        : PALETTE.primary,
                  })
                }
              >
                Sólido
              </Button>
              <Button
                type="button"
                size="sm"
                variant={currentSlide.background.type === "gradient" ? "default" : "outline"}
                className="h-8 flex-1 text-xs"
                onClick={() =>
                  api.setSlideBackground(currentIndex, {
                    type: "gradient",
                    from:
                      currentSlide.background.type === "gradient"
                        ? currentSlide.background.from
                        : PALETTE.navy,
                    to:
                      currentSlide.background.type === "gradient"
                        ? currentSlide.background.to
                        : PALETTE.primary,
                    angle: 135,
                  })
                }
              >
                Gradiente
              </Button>
            </div>
          </div>

          {bg.type === "solid" ? (
            <ColorField
              label="Cor de fundo"
              value={bg.color}
              onCommit={(color) => api.setSlideBackground(currentIndex, { type: "solid", color })}
            />
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <ColorField
                label="De"
                value={bg.from}
                onCommit={(from) =>
                  api.setSlideBackground(currentIndex, {
                    type: "gradient",
                    from,
                    to: bg.to,
                    angle: bg.angle,
                  })
                }
              />
              <ColorField
                label="Para"
                value={bg.to}
                onCommit={(to) =>
                  api.setSlideBackground(currentIndex, {
                    type: "gradient",
                    from: bg.from,
                    to,
                    angle: bg.angle,
                  })
                }
              />
              <div className="col-span-2">
                <NumberField
                  label="Ângulo (graus)"
                  value={bg.angle}
                  min={0}
                  max={360}
                  onCommit={(angle) =>
                    api.setSlideBackground(currentIndex, {
                      type: "gradient",
                      from: bg.from,
                      to: bg.to,
                      angle,
                    })
                  }
                />
              </div>
            </div>
          )}
        </Section>

        <Separator />

        <Section title="Paleta da marca">
          <div className="grid grid-cols-5 gap-2">
            {[
              { name: "Navy", c: PALETTE.primary },
              { name: "Deep", c: PALETTE.navy },
              { name: "Gold", c: PALETTE.gold },
              { name: "White", c: PALETTE.white },
              { name: "Soft", c: PALETTE.soft },
            ].map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => api.setSlideBackground(currentIndex, { type: "solid", color: p.c })}
                className="flex flex-col items-center gap-1 rounded-md p-1 transition-colors hover:bg-accent"
              >
                <span
                  className={cn("size-7 rounded-md ring-1 ring-black/10")}
                  style={{ background: p.c }}
                />
                <span className="text-[10px] text-muted-foreground">{p.name}</span>
              </button>
            ))}
          </div>
        </Section>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        Elemento · {ELEMENT_LABELS[element.type]}
      </p>

      {element.type === "text" && (
        <>
          <Section title="Conteúdo">
            <DraftInput value={element.text} multiline onCommit={(v) => patch({ text: v })} />
          </Section>
          <Section title="Tipografia">
            <div className="grid grid-cols-2 gap-3">
              <NumberField
                label="Tamanho"
                value={element.fontSize}
                min={8}
                max={200}
                onCommit={(v) => patch({ fontSize: v })}
              />
              <SelectField<ElementFontWeight>
                label="Peso"
                value={element.fontWeight}
                options={[
                  { value: 400, label: "400" },
                  { value: 500, label: "500" },
                  { value: 600, label: "600" },
                  { value: 700, label: "700" },
                ]}
                onCommit={(v) => patch({ fontWeight: v })}
              />
              <NumberField
                label="Espaçamento"
                value={element.letterSpacing}
                onCommit={(v) => patch({ letterSpacing: v })}
              />
              <AlignField value={element.align} onCommit={(v) => patch({ align: v })} />
            </div>
            <ColorField label="Cor" value={element.color} onCommit={(v) => patch({ color: v })} />
          </Section>
        </>
      )}

      {element.type === "card" && (
        <>
          <Section title="Conteúdo">
            <div>
              <Label className="text-xs text-muted-foreground">Título</Label>
              <DraftInput value={element.title} onCommit={(v) => patch({ title: v })} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Texto</Label>
              <DraftInput value={element.body} multiline onCommit={(v) => patch({ body: v })} />
            </div>
          </Section>
          <Section title="Aparência">
            <div className="grid grid-cols-2 gap-3">
              <NumberField
                label="Título (px)"
                value={element.titleSize}
                min={8}
                max={200}
                onCommit={(v) => patch({ titleSize: v })}
              />
              <NumberField
                label="Texto (px)"
                value={element.bodySize}
                min={8}
                max={200}
                onCommit={(v) => patch({ bodySize: v })}
              />
              <NumberField
                label="Borda (px)"
                value={element.radius}
                min={0}
                max={200}
                onCommit={(v) => patch({ radius: v })}
              />
              <NumberField
                label="Padding"
                value={element.padding}
                min={0}
                max={200}
                onCommit={(v) => patch({ padding: v })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <ColorField
                label="Cor do título"
                value={element.titleColor}
                onCommit={(v) => patch({ titleColor: v })}
              />
              <ColorField
                label="Cor do texto"
                value={element.bodyColor}
                onCommit={(v) => patch({ bodyColor: v })}
              />
            </div>
            <ColorField
              label="Fundo"
              value={element.background}
              onCommit={(v) => patch({ background: v })}
            />
          </Section>
        </>
      )}

      {element.type === "stat" && (
        <>
          <Section title="Conteúdo">
            <div>
              <Label className="text-xs text-muted-foreground">Valor</Label>
              <DraftInput value={element.value} onCommit={(v) => patch({ value: v })} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Rótulo</Label>
              <DraftInput value={element.label} onCommit={(v) => patch({ label: v })} />
            </div>
          </Section>
          <Section title="Aparência">
            <div className="grid grid-cols-2 gap-3">
              <NumberField
                label="Valor (px)"
                value={element.valueSize}
                min={8}
                max={200}
                onCommit={(v) => patch({ valueSize: v })}
              />
              <NumberField
                label="Rótulo (px)"
                value={element.labelSize}
                min={8}
                max={200}
                onCommit={(v) => patch({ labelSize: v })}
              />
              <NumberField
                label="Borda (px)"
                value={element.radius}
                min={0}
                max={200}
                onCommit={(v) => patch({ radius: v })}
              />
              <NumberField
                label="Padding"
                value={element.padding}
                min={0}
                max={200}
                onCommit={(v) => patch({ padding: v })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <ColorField
                label="Cor do valor"
                value={element.valueColor}
                onCommit={(v) => patch({ valueColor: v })}
              />
              <ColorField
                label="Cor do rótulo"
                value={element.labelColor}
                onCommit={(v) => patch({ labelColor: v })}
              />
            </div>
            <ColorField
              label="Fundo"
              value={element.background}
              onCommit={(v) => patch({ background: v })}
            />
          </Section>
        </>
      )}

      {element.type === "image" && (
        <>
          <Section title="Imagem">
            <div>
              <Label className="text-xs text-muted-foreground">URL da imagem</Label>
              <DraftInput value={element.src} onCommit={(v) => patch({ src: v })} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Texto alternativo</Label>
              <DraftInput value={element.alt} onCommit={(v) => patch({ alt: v })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <SelectField<"cover" | "contain">
                label="Ajuste"
                value={element.objectFit}
                options={[
                  { value: "cover", label: "Cobrir" },
                  { value: "contain", label: "Ajustar" },
                ]}
                onCommit={(v) => patch({ objectFit: v })}
              />
              <NumberField
                label="Borda (px)"
                value={element.radius}
                min={0}
                max={200}
                onCommit={(v) => patch({ radius: v })}
              />
            </div>
          </Section>
        </>
      )}

      {element.type === "shape" && (
        <Section title="Forma">
          <SelectField<ShapeKind>
            label="Tipo"
            value={element.kind}
            options={[
              { value: "bar", label: "Barra" },
              { value: "line", label: "Linha" },
              { value: "rect", label: "Retângulo" },
              { value: "circle", label: "Círculo" },
              { value: "pill", label: "Pílula" },
            ]}
            onCommit={(v) => patch({ kind: v })}
          />
          <ColorField label="Cor" value={element.color} onCommit={(v) => patch({ color: v })} />
        </Section>
      )}

      <Separator />

      <Section title="Posição e tamanho">
        <div className="grid grid-cols-2 gap-3">
          <NumberField
            label="X"
            value={element.x}
            min={0}
            max={SLIDE_WIDTH}
            onCommit={(v) => patch({ x: v })}
          />
          <NumberField
            label="Y"
            value={element.y}
            min={0}
            max={SLIDE_HEIGHT}
            onCommit={(v) => patch({ y: v })}
          />
          <NumberField
            label="Largura"
            value={element.w}
            min={24}
            max={SLIDE_WIDTH}
            onCommit={(v) => patch({ w: v })}
          />
          <NumberField
            label="Altura"
            value={element.h}
            min={24}
            max={SLIDE_HEIGHT}
            onCommit={(v) => patch({ h: v })}
          />
          <NumberField
            label="Rotação"
            value={element.rotate}
            min={-180}
            max={180}
            onCommit={(v) => patch({ rotate: v })}
          />
          <NumberField
            label="Opacidade %"
            value={Math.round(element.opacity * 100)}
            min={0}
            max={100}
            onCommit={(v) => patch({ opacity: v / 100 })}
          />
        </div>
        <div className="grid grid-cols-2 gap-2 pt-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => api.bringForward(element.id)}
          >
            <ArrowUpToLine className="size-4" />
            Frente
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => api.sendBackward(element.id)}
          >
            <ArrowDownToLine className="size-4" />
            Trás
          </Button>
        </div>
      </Section>

      <Separator />

      <Button
        type="button"
        variant="destructive"
        size="sm"
        className="w-full"
        onClick={() => api.deleteElement(element.id)}
      >
        <Trash2 className="size-4" />
        Remover elemento
      </Button>
    </div>
  );
}

const ELEMENT_LABELS: Record<SlideElement["type"], string> = {
  text: "Texto",
  card: "Card",
  stat: "Indicador",
  image: "Imagem",
  shape: "Forma",
};
