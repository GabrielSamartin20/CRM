const products = [
  { name: 'Plano CRM Professional', category: 'Assinatura', value: 'R$ 2.490,00/mês', availability: 'Ativo' },
  { name: 'Onboarding Consultivo', category: 'Serviço', value: 'R$ 8.900,00', availability: 'Ativo' },
  { name: 'Integração WhatsApp Plus', category: 'Add-on', value: 'R$ 690,00/mês', availability: 'Ativo' }
];

export function ProductsPage() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-[#0B1D3A]">Portfólio Comercial</h3>
        <p className="mt-1 text-sm text-slate-600">Gestão de produtos e serviços ofertados no pipeline, com visão de valor e posicionamento.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {products.map((product) => (
          <article key={product.name} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-widest text-slate-500">{product.category}</p>
            <h4 className="mt-2 text-lg font-semibold text-slate-900">{product.name}</h4>
            <p className="mt-4 text-xl font-semibold text-[#0B1D3A]">{product.value}</p>
            <p className="mt-2 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs text-emerald-700">{product.availability}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
