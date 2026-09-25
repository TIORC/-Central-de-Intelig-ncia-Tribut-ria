import {
  PALETTE,
  footer,
  header,
  makeCard,
  makeShape,
  makeStat,
  makeText,
  uid,
} from "@/data/slide-templates";
import type { Presentation, Slide, SlideElement } from "@/types/presentation";
import { SLIDE_HEIGHT, SLIDE_WIDTH } from "@/types/presentation";
import { brl, compactBrl, joinMonths, percent, periodRange, shortLabel } from "./format";
import type { PlanejamentoData, RegimeData } from "./planejamento";
import type { DocModel, DocSection } from "./types";

export const KICKER = "CENTRAL DE INTELIGÊNCIA TRIBUTÁRIA";

type Slot = { x: number; y: number; w: number; h: number };

const CARD_ZONE: Slot = { x: 64, y: 344, w: 1152, h: 292 };

/** Distribui N cards numa área fixa do slide (grade uniforme). */
function slots(count: number, zone: Slot, perRow: number, gap = 26): Slot[] {
  if (count <= 0) return [];
  const rows = Math.max(1, Math.ceil(count / perRow));
  const w = (zone.w - gap * (perRow - 1)) / perRow;
  const h = (zone.h - gap * (rows - 1)) / rows;

  return Array.from({ length: count }, (_, i) => ({
    x: zone.x + (i % perRow) * (w + gap),
    y: zone.y + Math.floor(i / perRow) * (h + gap),
    w,
    h,
  }));
}

function cardGrid(
  items: { title: string; body: string; accent?: boolean }[],
  options: { zone?: Slot; perRow: number } = { perRow: 3 },
): SlideElement[] {
  const zone = options.zone ?? CARD_ZONE;
  const items2 = items.slice();

  return slots(items2.length, zone, options.perRow).map((slot, i) => {
    const item = items2[i] ?? { title: "", body: "" };
    return makeCard({
      ...slot,
      title: item.title,
      body: item.body,
      titleSize: slot.w < 340 ? 15 : 18,
      bodySize: slot.w < 340 ? 13 : 15,
      titleColor: item.accent ? PALETTE.gold : "rgba(255,255,255,0.92)",
      background: item.accent ? "rgba(184,138,26,0.16)" : "rgba(255,255,255,0.10)",
      padding: slot.w < 340 ? 18 : 24,
      radius: 14,
      zIndex: 1,
    });
  });
}

function subheader(texto: string): SlideElement {
  return makeText({
    x: 76,
    y: 300,
    w: 1128,
    h: 34,
    text: texto,
    fontSize: 18,
    fontWeight: 400,
    color: PALETTE.gold,
    zIndex: 11,
  });
}

function slide(name: string, background: string, elements: SlideElement[]): Slide {
  return { id: uid("slide"), name, background: { type: "solid", color: background }, elements };
}

function capaSlide(data: PlanejamentoData): Slide {
  const meta = [data.cliente, data.cnpj ? `CNPJ ${data.cnpj}` : "", periodRange(data.periodos)]
    .filter(Boolean)
    .join("  ·  ");

  return slide("Capa", PALETTE.navy, [
    makeShape("bar", { x: 0, y: 0, w: SLIDE_WIDTH, h: 8, color: PALETTE.gold, zIndex: 10 }),
    makeText({
      x: 76,
      y: 150,
      w: 1000,
      h: 30,
      text: KICKER,
      fontSize: 16,
      fontWeight: 600,
      letterSpacing: 2,
      color: PALETTE.gold,
      zIndex: 11,
    }),
    makeText({
      x: 76,
      y: 200,
      w: 1120,
      h: 140,
      text: data.titulo || "Planejamento Tributário",
      fontSize: 56,
      fontWeight: 700,
      color: PALETTE.white,
      zIndex: 12,
    }),
    makeText({
      x: 76,
      y: 352,
      w: 1000,
      h: 44,
      text: meta,
      fontSize: 20,
      fontWeight: 500,
      color: "rgba(255,255,255,0.88)",
      zIndex: 12,
    }),
    makeText({
      x: 76,
      y: 404,
      w: 1000,
      h: 32,
      text: `Comparativo de regimes tributários · Fonte: aba ${data.fonte}`,
      fontSize: 16,
      fontWeight: 400,
      color: "rgba(255,255,255,0.6)",
      zIndex: 12,
    }),
    ...footer("01"),
  ]);
}

function encerramentoSlide(page: string, extra: string): Slide {
  return slide("Encerramento", PALETTE.navy, [
    makeShape("bar", { x: 0, y: 0, w: SLIDE_WIDTH, h: 8, color: PALETTE.gold, zIndex: 10 }),
    makeText({
      x: 0,
      y: 190,
      w: SLIDE_WIDTH,
      h: 110,
      text: "Obrigado.",
      fontSize: 64,
      fontWeight: 700,
      align: "center",
      color: PALETTE.gold,
      letterSpacing: 1,
      zIndex: 11,
    }),
    makeText({
      x: 140,
      y: 320,
      w: 1000,
      h: 90,
      text: extra,
      fontSize: 20,
      fontWeight: 400,
      align: "center",
      color: "rgba(255,255,255,0.75)",
      zIndex: 11,
    }),
    ...footer(page),
  ]);
}

function regimeSlide(regime: RegimeData, page: string, contexto: string): Slide {
  const detalhes = regime.detalhes.slice(0, 8);
  const items = detalhes.length
    ? detalhes.map((item) => ({ title: shortLabel(item.label, 24), body: brl(item.total) }))
    : [{ title: "Sem detalhamento", body: "A planilha não abre os tributos deste regime." }];

  return slide(regime.nome, PALETTE.primary, [
    ...header(regime.nome),
    subheader(
      `Total no período: ${brl(regime.total)} · ${percent(regime.percentualMedio)} da receita · ${contexto}`,
    ),
    ...cardGrid(items, { perRow: items.length > 4 ? 4 : 3, zone: { x: 64, y: 352, w: 1152, h: 276 } }),
    ...footer(page),
  ]);
}

function estudoSlide(data: PlanejamentoData): Slide {
  const cliente = data.cliente || "o cliente";
  const regimes = data.regimes.map((r) => r.nome).join(", ") || "não identificados";

  const items = [
    {
      title: "Escopo do estudo",
      body: `Revisão da carga tributária de ${cliente}, com apuração de receitas, tributos e simulação dos regimes aplicáveis ao segmento.`,
    },
    {
      title: "Período analisado",
      body: `${periodRange(data.periodos)}\nFonte: aba ${data.fonte} da planilha enviada.`,
    },
    {
      title: "Regimes comparados",
      body: `${regimes}\nBase de cálculo: ${brl(data.receitaTotal)} de receita apurada no período.`,
      accent: true,
    },
  ];

  return slide("Sobre o estudo", PALETTE.primary, [
    ...header("Sobre o estudo"),
    subheader("Metodologia, período e base de dados utilizados neste comparativo."),
    ...cardGrid(items, { perRow: 3 }),
    ...footer("02"),
  ]);
}

function receitaSlide(data: PlanejamentoData): Slide {
  const meses = data.receitaMensal.filter((v) => v !== 0).length || data.periodos.length || 1;
  const media = data.receitaTotal / meses;
  const mesesLabel = String(meses).padStart(2, "0");
  const stats = slots(3, { x: 64, y: 344, w: 1152, h: 170 }, 3).map((slot, i) =>
    makeStat({
      ...slot,
      value: i === 0 ? brl(data.receitaTotal) : i === 1 ? brl(media) : mesesLabel,
      label:
        i === 0
          ? "Receita total no período"
          : i === 1
            ? "Receita média por competência"
            : "Competências analisadas",
      valueSize: i === 2 ? 48 : 34,
      zIndex: 1,
    }),
  );

  return slide("Receita total do período", PALETTE.primary, [
    ...header("Receita total do período"),
    subheader("Base de apuração consolidada a partir das competências da planilha."),
    ...stats,
    makeCard({
      x: 64,
      y: 536,
      w: 1152,
      h: 100,
      title: "Evolução mensal da receita",
      titleSize: 15,
      bodySize: 13,
      body: joinMonths(data.periodos, data.receitaMensal) || "Sem dados mensais identificados.",
      background: "rgba(255,255,255,0.10)",
      padding: 20,
      radius: 14,
      zIndex: 1,
    }),
    ...footer("03"),
  ]);
}

function composicaoSlide(data: PlanejamentoData): Slide {
  const receitas = data.receitas.slice(0, 2);
  const stats = slots(Math.max(1, receitas.length), { x: 64, y: 344, w: 1152, h: 170 }, 2).map(
    (slot, i) =>
      makeStat({
        ...slot,
        value: brl(receitas[i]?.total ?? 0),
        label: shortLabel(receitas[i]?.label ?? "Receita sem tributos", 46),
        valueSize: 32,
        zIndex: 1,
      }),
  );

  return slide("Composição da receita", PALETTE.primary, [
    ...header("Composição da receita"),
    subheader("Abertura da receita entre operações tributadas e não tributadas."),
    ...stats,
    makeCard({
      x: 64,
      y: 536,
      w: 1152,
      h: 100,
      title: "Percentual tributado por competência",
      titleSize: 15,
      bodySize: 13,
      body:
        joinMonths(data.periodos, data.percentualTributado, percent) ||
        "A planilha não traz o percentual tributado por competência.",
      background: "rgba(255,255,255,0.10)",
      padding: 20,
      radius: 14,
      zIndex: 1,
    }),
    ...footer("04"),
  ]);
}

function simplesSlide(
  regime: RegimeData,
  data: PlanejamentoData,
  page: string,
  contexto: string,
): Slide {
  const melhor = data.melhorRegime && data.melhorRegime.key !== "simples" ? data.melhorRegime : null;
  const diferenca = melhor ? regime.total - melhor.total : 0;

  const stats = slots(3, { x: 64, y: 344, w: 1152, h: 176 }, 3).map((slot, i) =>
    makeStat({
      ...slot,
      value:
        i === 0
          ? brl(regime.total)
          : i === 1
            ? percent(regime.percentualMedio)
            : melhor
              ? `${diferenca >= 0 ? "+" : ""}${brl(diferenca)}`
              : "—",
      label:
        i === 0
          ? "Total do Simples Nacional no período"
          : i === 1
            ? "Carga sobre a receita apurada"
            : melhor
              ? `Diferença frente a ${melhor.nome}`
              : "Comparativo indisponível",
      valueSize: 30,
      labelSize: 14,
      zIndex: 1,
    }),
  );

  const leitura = melhor
    ? diferenca > 0
      ? `Neste recorte o Simples Nacional é a opção mais onerosa: ${brl(diferenca)} acima de ${melhor.nome}.`
      : `Neste recorte o Simples Nacional é competitivo: ${brl(Math.abs(diferenca))} abaixo de ${melhor.nome}.`
    : "Sem base comparativa suficiente na planilha para avaliar o Simples Nacional.";

  return slide(regime.nome, PALETTE.primary, [
    ...header(regime.nome),
    subheader(`Recolhimento unificado em guia única (DAS) · ${contexto}`),
    ...stats,
    makeCard({
      x: 64,
      y: 542,
      w: 1152,
      h: 94,
      title: "Como interpretar",
      titleSize: 15,
      bodySize: 14,
      titleColor: PALETTE.gold,
      body: `${leitura} Valide anexo, faixa de faturamento e sublimites antes de qualquer decisão.`,
      background: "rgba(184,138,26,0.16)",
      padding: 20,
      radius: 14,
      zIndex: 1,
    }),
    ...footer(page),
  ]);
}

function comparativoSlide(data: PlanejamentoData): Slide {
  const regimes = data.regimes.slice(0, 4);
  const stats = slots(regimes.length || 1, { x: 64, y: 344, w: 1152, h: 176 }, regimes.length > 3 ? 4 : 3).map(
    (slot, i) => {
      const regime = regimes[i];
      return makeStat({
        ...slot,
        value: brl(regime?.total ?? 0),
        label: regime?.nome ?? "Sem dados",
        valueSize: slot.w < 320 ? 24 : 30,
        labelSize: 14,
        zIndex: 1,
      });
    },
  );

  const melhor = data.melhorRegime;
  const pior = [...data.regimes].sort((a, b) => b.total - a.total)[0] ?? null;
  const economia = melhor && pior ? pior.total - melhor.total : 0;

  const texto = melhor
    ? melhor.total > 0
      ? `Melhor cenário: ${melhor.nome} com ${brl(melhor.total)} (${percent(melhor.percentualMedio)} da receita).${economia > 0 && pior ? ` Economia de ${brl(economia)} frente a ${pior.nome}.` : ""}`
      : "Nenhum regime apresentou tributo a recolher no período analisado."
    : "A planilha não permitiu comparar os regimes.";

  return slide("Comparativo de regimes", PALETTE.primary, [
    ...header("Comparativo de regimes"),
    subheader("Carga tributária total por regime e recomendação preliminar."),
    ...stats,
    makeCard({
      x: 64,
      y: 542,
      w: 1152,
      h: 94,
      title: "Recomendação preliminar",
      titleSize: 15,
      bodySize: 14,
      titleColor: PALETTE.gold,
      body: texto,
      background: "rgba(184,138,26,0.16)",
      padding: 20,
      radius: 14,
      zIndex: 1,
    }),
    ...footer("08"),
  ]);
}

function economiaSlide(data: PlanejamentoData): Slide {
  const melhor = data.melhorRegime;
  const pior = [...data.regimes].sort((a, b) => b.total - a.total)[0] ?? null;
  const economia = data.economia;

  const subtitulo = economia && melhor && pior
    ? `${melhor.nome} comparado a ${pior.nome}, mantida a base de receita apurada · linha de origem: "${shortLabel(economia.label, 40)}".`
    : "Estimativa construída a partir da diferença entre o melhor e o pior cenário.";

  const detalhe = economia
    ? joinMonths(data.periodos, economia.mensal)
    : melhor
      ? `Carga de ${melhor.nome}: ${brl(melhor.total)} no período.`
      : "Sem dados de economia identificados na planilha.";

  return slide("Economia estimada", PALETTE.primary, [
    ...header("Economia estimada"),
    subheader(subtitulo),
    makeStat({
      x: 64,
      y: 344,
      w: 1152,
      h: 176,
      value: brl(economia?.total ?? 0),
      label: "Economia estimada no melhor cenário",
      valueSize: 64,
      labelSize: 20,
      zIndex: 1,
    }),
    makeCard({
      x: 64,
      y: 542,
      w: 1152,
      h: 94,
      title: "Economia por competência",
      titleSize: 15,
      bodySize: 13,
      body: detalhe,
      background: "rgba(255,255,255,0.10)",
      padding: 20,
      radius: 14,
      zIndex: 1,
    }),
    ...footer("09"),
  ]);
}

/**
 * Monta a apresentação de 10 slides de um Planejamento Tributário
 * usando a identidade visual padrão da Lumina.
 */
export function buildPlanejamentoPresentation(
  data: PlanejamentoData,
  options: { nome: string },
): Presentation {
  const contexto = data.periodos.length
    ? `base ${data.periodos[0]}–${data.periodos[data.periodos.length - 1]}`
    : "base informada na planilha";

  const ordem: { regime: RegimeData | null; page: string }[] = [
    { regime: data.regimes.find((r) => r.key === "presumido") ?? null, page: "05" },
    { regime: data.regimes.find((r) => r.key === "real") ?? null, page: "06" },
    { regime: data.regimes.find((r) => r.key === "simples") ?? null, page: "07" },
  ];

  const slides = ordem.map(({ regime, page }) => {
    if (!regime) {
      return slide("Regime não identificado", PALETTE.primary, [
        ...header("Regime não identificado"),
        subheader("A planilha enviada não trouxe dados suficientes para este regime."),
        ...cardGrid(
          [
            {
              title: "O que verificar",
              body: "Confirme se a aba possui o bloco de apuração deste regime com valores por competência.",
            },
          ],
          { perRow: 1, zone: { x: 64, y: 352, w: 1152, h: 200 } },
        ),
        ...footer(page),
      ]);
    }
    return regime.key === "simples"
      ? simplesSlide(regime, data, page, contexto)
      : regimeSlide(regime, page, contexto);
  });

  return {
    id: uid("pres"),
    name: options.nome,
    slides: [
      capaSlide(data),
      estudoSlide(data),
      receitaSlide(data),
      composicaoSlide(data),
      ...slides,
      comparativoSlide(data),
      economiaSlide(data),
      encerramentoSlide(
        "10",
        "Estamos à disposição para detalhar o cenário recomendado, validar premissas e conduzir a implementação das oportunidades identificadas.",
      ),
    ],
  };
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

type DocBlock = { heading: string; bullets: string[]; paragraphs: string[] };

function normalizeBlocks(model: DocModel): DocBlock[] {
  const blocks: DocBlock[] = [];

  model.sections.forEach((section) => {
    const bullets = section.bullets.length ? section.bullets : section.paragraphs;
    const groups = chunk(bullets, 6);

    if (groups.length === 0) {
      blocks.push({
        heading: section.heading,
        bullets: [],
        paragraphs: section.paragraphs.slice(0, 2),
      });
      return;
    }

    groups.forEach((group, index) => {
      blocks.push({
        heading: index === 0 ? section.heading : `${section.heading} · continuação ${index + 1}`,
        bullets: group,
        paragraphs: index === 0 ? section.paragraphs.slice(0, 1) : [],
      });
    });
  });

  if (blocks.length === 0) {
    blocks.push({
      heading: model.title,
      bullets: ["Não foi possível estruturar o conteúdo deste arquivo automaticamente."],
      paragraphs: [],
    });
  }

  return blocks.slice(0, 8);
}

function genericCapa(model: DocModel): Slide {
  const meta = model.meta.map((item) => `${item.label}: ${item.value}`).join("  ·  ");

  return slide("Capa", PALETTE.navy, [
    makeShape("bar", { x: 0, y: 0, w: SLIDE_WIDTH, h: 8, color: PALETTE.gold, zIndex: 10 }),
    makeText({
      x: 76,
      y: 150,
      w: 1000,
      h: 30,
      text: KICKER,
      fontSize: 16,
      fontWeight: 600,
      letterSpacing: 2,
      color: PALETTE.gold,
      zIndex: 11,
    }),
    makeText({
      x: 76,
      y: 205,
      w: 1120,
      h: 150,
      text: model.title,
      fontSize: 52,
      fontWeight: 700,
      color: PALETTE.white,
      zIndex: 12,
    }),
    makeText({
      x: 76,
      y: 362,
      w: 1000,
      h: 40,
      text:
        model.subtitle ??
        "Documento convertido em apresentação pela Central de Inteligência Tributária.",
      fontSize: 18,
      fontWeight: 400,
      color: "rgba(255,255,255,0.78)",
      zIndex: 12,
    }),
    makeText({
      x: 76,
      y: 412,
      w: 1000,
      h: 30,
      text: meta,
      fontSize: 14,
      fontWeight: 400,
      color: "rgba(255,255,255,0.55)",
      zIndex: 12,
    }),
    ...footer("01"),
  ]);
}

function genericContentSlide(block: DocBlock, page: string): Slide {
  const items = block.bullets.length
    ? block.bullets.map((bullet, index) => ({
        title: `Ponto ${String(index + 1).padStart(2, "0")}`,
        body: bullet,
      }))
    : [{ title: "Resumo", body: block.paragraphs.join("\n\n") || "Sem conteúdo." }];

  const zone: Slot = items.length === 1 ? { x: 64, y: 352, w: 1152, h: 276 } : CARD_ZONE;

  return slide(block.heading, PALETTE.primary, [
    ...header(block.heading),
    subheader(
      block.paragraphs.length
        ? shortLabel(block.paragraphs[0] ?? block.heading, 130)
        : "Conteúdo extraído automaticamente do arquivo importado.",
    ),
    ...cardGrid(items, {
      perRow: items.length > 4 ? 3 : Math.max(1, Math.min(3, items.length)),
      zone,
    }),
    ...footer(page),
  ]);
}

function genericEncerramento(page: string): Slide {
  return encerramentoSlide(
    page,
    "Apresentação gerada automaticamente a partir do arquivo importado. Revise os textos e ajuste o conteúdo no editor antes de compartilhar com o cliente.",
  );
}

/** Builder genérico para Word/PDF/planilhas fora do layout de planejamento. */
export function buildGenericPresentation(
  model: DocModel,
  options: { nome: string },
): Presentation {
  const blocks = normalizeBlocks(model);

  return {
    id: uid("pres"),
    name: options.nome,
    slides: [
      genericCapa(model),
      ...blocks.map((block, index) =>
        genericContentSlide(block, String(index + 2).padStart(2, "0")),
      ),
      genericEncerramento(String(blocks.length + 2).padStart(2, "0")),
    ],
  };
}

