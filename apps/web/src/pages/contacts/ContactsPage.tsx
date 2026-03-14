const contacts = [
  { name: 'Grupo Orion', segment: 'Enterprise', channel: 'Google Ads', manager: 'Marina Costa' },
  { name: 'Hospital Santa Clara', segment: 'Mid Market', channel: 'Referral', manager: 'Bruno Matos' },
  { name: 'Rede Prime Saúde', segment: 'Enterprise', channel: 'Meta Ads', manager: 'Juliana Alves' }
];

export function ContactsPage() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-[#0B1D3A]">Contatos Estratégicos</h3>
      <p className="mt-1 text-sm text-slate-600">Base qualificada de contas e pessoas, consolidada para relacionamento comercial contínuo.</p>
      <div className="mt-5 overflow-hidden rounded-xl border border-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-100 text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">Conta</th>
              <th className="px-4 py-3 font-medium">Segmento</th>
              <th className="px-4 py-3 font-medium">Origem</th>
              <th className="px-4 py-3 font-medium">Responsável</th>
            </tr>
          </thead>
          <tbody>
            {contacts.map((contact) => (
              <tr key={contact.name} className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium text-slate-800">{contact.name}</td>
                <td className="px-4 py-3 text-slate-600">{contact.segment}</td>
                <td className="px-4 py-3 text-slate-600">{contact.channel}</td>
                <td className="px-4 py-3 text-slate-600">{contact.manager}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
