import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { Deal } from '../../../types/kanban';
import { DealCard } from '../components/DealCard';
import { SlaIndicator } from '../components/SlaIndicator';
import { ChannelBadge } from '../components/ChannelBadge';

const baseDeal: Deal = {
  id: 'd1',
  title: 'Deal test',
  contactId: 'c1',
  contact: { id: 'c1', name: 'Maria' },
  pipelineId: 'p1',
  stageId: 's1',
  currency: 'BRL',
  tags: [],
  channel: 'GOOGLE_ADS',
  daysInStage: 1,
  slaStatus: 'warning'
};

describe('DealCard', () => {
  it('does not render SLA when status is ok', () => {
    render(<SlaIndicator slaStatus="ok" hoursInStage={10} />);
    expect(screen.queryByText(/Atrasado/i)).toBeNull();
  });

  it('renders overdue SLA pill', () => {
    render(<SlaIndicator slaStatus="overdue" hoursInStage={80} />);
    expect(screen.getByText('Atrasado')).toBeInTheDocument();
  });

  it('renders channel badge text', () => {
    render(<ChannelBadge channel="META_ADS" />);
    expect(screen.getByText('Meta Ads')).toBeInTheDocument();
  });

  it('renders deal card content', () => {
    render(
      <MemoryRouter initialEntries={['/kanban/p1']}>
        <DealCard deal={baseDeal} />
      </MemoryRouter>
    );
    expect(screen.getByText('Deal test')).toBeInTheDocument();
  });
});
