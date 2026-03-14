import { Navigate, Route, Routes } from 'react-router-dom';
import { KanbanPage } from './pages/kanban/KanbanPage';

export function App() {
  return (
    <Routes>
      <Route path="/kanban" element={<KanbanPage />} />
      <Route path="/kanban/:pipelineId" element={<KanbanPage />} />
      <Route path="/kanban/:pipelineId/deals/:dealId" element={<KanbanPage />} />
      <Route path="*" element={<Navigate to="/kanban" replace />} />
    </Routes>
  );
}
