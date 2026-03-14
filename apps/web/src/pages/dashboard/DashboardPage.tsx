const cards = [
  { label: 'Receita prevista', value: 'R$ 1.280.000', trend: '+14% no mês' },
  { label: 'Taxa de conversão', value: '23,4%', trend: '+2,1 p.p.' },
  { label: 'Novos leads', value: '412', trend: '+9% na semana' },
  { label: 'Atividades pendentes', value: '58', trend: 'Prioridade alta: 12' }
];

export function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-[#0B1D3A] to-[#12386C] px-8 py-7 text-white">
        <h3 className="text-xl font-semibold">Painel Executivo de Vendas</h3>
        <p className="mt-2 max-w-3xl text-sm text-blue-100">
          Acompanhe os principais indicadores comerciais, monitore gargalos no funil e mantenha o ritmo operacional com visão estratégica unificada.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <article key={card.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">{card.label}</p>
            <p className="mt-3 text-2xl font-semibold text-[#0B1D3A]">{card.value}</p>
            <p className="mt-1 text-xs text-emerald-600">{card.trend}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
