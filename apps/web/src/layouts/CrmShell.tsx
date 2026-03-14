import { NavLink, Outlet, useLocation } from 'react-router-dom';

interface NavItem {
  label: string;
  path: string;
  description: string;
}

const navItems: NavItem[] = [
  { label: 'Visão Geral', path: '/dashboard', description: 'Panorama executivo do funil e operação' },
  { label: 'Negócios', path: '/kanban', description: 'Gestão do pipeline comercial e oportunidades' },
  { label: 'Atividades', path: '/activities', description: 'Agenda e tarefas da equipe comercial' },
  { label: 'Contatos', path: '/contacts', description: 'Base de contatos e relacionamento' },
  { label: 'Produtos', path: '/products', description: 'Catálogo e itens comercializados' }
];

const initials = (text: string): string =>
  text
    .split(' ')
    .slice(0, 2)
    .map((value) => value[0]?.toUpperCase() ?? '')
    .join('');

export function CrmShell() {
  const location = useLocation();

  const activeItem = navItems.find((item) => location.pathname.startsWith(item.path)) ?? navItems[0];

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="flex min-h-screen">
        <aside className="w-72 bg-[#0B1D3A] px-5 py-7 text-slate-100 shadow-2xl">
          <div className="mb-10">
            <p className="text-xs uppercase tracking-[0.25em] text-blue-200/80">CRM Platform</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">Operações Comerciais</h1>
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `group block rounded-xl border px-4 py-3 transition ${
                    isActive ? 'border-blue-300 bg-blue-400/20 text-white' : 'border-transparent bg-white/5 text-blue-100 hover:border-blue-300/40 hover:bg-white/10'
                  }`
                }
              >
                <p className="font-medium">{item.label}</p>
                <p className="mt-1 text-xs text-blue-100/80">{item.description}</p>
              </NavLink>
            ))}
          </nav>

          <div className="mt-10 rounded-xl border border-blue-300/30 bg-white/5 p-4 text-xs text-blue-100/85">
            <p className="font-semibold text-blue-100">Conectividade</p>
            <p className="mt-1">Estrutura preparada para WhatsApp, atribuição UTM e automações de funil.</p>
          </div>
        </aside>

        <main className="flex-1">
          <header className="border-b border-slate-200 bg-white px-8 py-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500">Área operacional</p>
                <h2 className="text-2xl font-semibold text-[#0B1D3A]">{activeItem.label}</h2>
                <p className="text-sm text-slate-600">{activeItem.description}</p>
              </div>
              <div className="flex items-center gap-3 rounded-full border border-slate-200 px-4 py-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0B1D3A] text-xs font-semibold text-white">{initials('Equipe Comercial')}</div>
                <div>
                  <p className="text-sm font-medium">Equipe Comercial</p>
                  <p className="text-xs text-slate-500">Perfil Gestor</p>
                </div>
              </div>
            </div>
          </header>

          <section className="p-8">
            <Outlet />
          </section>
        </main>
      </div>
    </div>
  );
}
