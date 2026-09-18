export function SampleSlide({ title = "Carga tributária consolidada" }: { title?: string }) {
  return (
    <div className="relative flex h-full w-full flex-col justify-between overflow-hidden bg-primary p-[6%] text-primary-foreground">
      <span className="absolute top-0 left-0 h-[6px] w-full bg-accent" />

      <div>
        <p className="text-[1.4cqw] font-medium tracking-[0.18em] text-accent uppercase">
          Diagnóstico Tributário · 2026
        </p>
        <h3 className="mt-[2%] max-w-[80%] font-display text-[3.6cqw] leading-tight font-semibold">
          {title}
        </h3>
      </div>

      <div className="grid grid-cols-3 gap-[3%]">
        {[
          { value: "R$ 4,2 mi", label: "Tributos apurados" },
          { value: "12,8%", label: "Economia potencial" },
          { value: "R$ 538 mil", label: "Créditos identificados" },
        ].map((item) => (
          <div key={item.label} className="rounded-md bg-white/8 p-[5%]">
            <p className="font-display text-[2.4cqw] font-semibold text-accent">{item.value}</p>
            <p className="mt-[6%] text-[1.3cqw] text-primary-foreground/75">{item.label}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between text-[1.1cqw] text-primary-foreground/60">
        <span>Central de Inteligência Tributária</span>
        <span>01</span>
      </div>
    </div>
  );
}
