import { Navigate, Route, Routes } from 'react-router-dom';
import { CrmShell } from './layouts/CrmShell';
import { ActivitiesPage } from './pages/activities/ActivitiesPage';
import { ContactsPage } from './pages/contacts/ContactsPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { KanbanPage } from './pages/kanban/KanbanPage';
import { ProductsPage } from './pages/products/ProductsPage';

export function App() {
  return (
    <Routes>
      <Route element={<CrmShell />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/kanban" element={<KanbanPage />} />
        <Route path="/kanban/:pipelineId" element={<KanbanPage />} />
        <Route path="/kanban/:pipelineId/deals/:dealId" element={<KanbanPage />} />
        <Route path="/activities" element={<ActivitiesPage />} />
        <Route path="/contacts" element={<ContactsPage />} />
        <Route path="/products" element={<ProductsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
