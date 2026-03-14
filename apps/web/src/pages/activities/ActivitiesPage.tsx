const activities = [
  { title: 'Follow-up com cliente enterprise', owner: 'Marina Costa', due: 'Hoje, 16:00', status: 'Em andamento' },
  { title: 'Reunião de proposta técnica', owner: 'Bruno Matos', due: 'Amanhã, 10:30', status: 'Agendado' },
  { title: 'Retorno de negociação contratual', owner: 'Juliana Alves', due: '27/03, 11:00', status: 'Pendente' }
];

export function ActivitiesPage() {
  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-[#0B1D3A]">Atividades Comerciais</h3>
      <p className="text-sm text-slate-600">Controle formal das atividades táticas para assegurar previsibilidade de execução no funil de vendas.</p>
      <div className="space-y-3">
        {activities.map((activity) => (
          <article key={activity.title} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="font-medium text-slate-800">{activity.title}</p>
            <p className="mt-1 text-sm text-slate-600">Responsável: {activity.owner}</p>
            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="rounded-full bg-blue-100 px-3 py-1 text-blue-800">{activity.status}</span>
              <span className="text-slate-500">Prazo: {activity.due}</span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
