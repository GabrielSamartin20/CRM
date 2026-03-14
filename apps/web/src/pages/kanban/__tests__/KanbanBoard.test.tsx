import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { useDealsStore } from '../../../store/deals.store';
import { Pipeline } from '../../../types/kanban';
import { KanbanBoard } from '../components/KanbanBoard';

const pipeline: Pipeline = {
  id: 'p1',
  name: 'Principal',
  order: 1,
  stages: [
    { id: 's1', pipelineId: 'p1', name: 'Novo', color: '#0ea5e9', probability: 10, order: 1, type: 'OPEN' },
    { id: 's2', pipelineId: 'p1', name: 'Perdido', color: '#ef4444', probability: 0, order: 2, type: 'CLOSED_LOST' }
  ]
};

describe('KanbanBoard', () => {
  it('renders stage columns and deal in correct column', () => {
    useDealsStore.setState({
      columns: {
        s1: [{ id: 'd1', title: 'Deal 1', contactId: 'c1', pipelineId: 'p1', stageId: 's1', currency: 'BRL', tags: [], channel: 'DIRECT', daysInStage: 1, slaStatus: 'ok' }],
        s2: []
      }
    });

    render(
      <MemoryRouter initialEntries={['/kanban/p1']}>
        <KanbanBoard pipeline={pipeline} onAddDeal={() => {}} />
      </MemoryRouter>
    );

    expect(screen.getByText('Novo')).toBeInTheDocument();
    expect(screen.getByText('Perdido')).toBeInTheDocument();
    expect(screen.getByText('Deal 1')).toBeInTheDocument();
  });
});
