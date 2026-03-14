import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { dealsApi } from '../../../api/deals.api';
import { Contact, Deal, Pipeline, Stage, UserSummary } from '../../../types/kanban';

const schema = z.object({
  title: z.string().min(1),
  contactId: z.string().min(1),
  pipelineId: z.string().min(1),
  stageId: z.string().min(1),
  value: z.number().optional(),
  currency: z.string().min(3),
  expectedCloseDate: z.string().optional(),
  assigneeId: z.string().optional(),
  tags: z.array(z.string()).default([])
});

type DealFormInput = z.infer<typeof schema>;

interface DealFormProps {
  mode: 'create' | 'edit';
  contacts: Contact[];
  assignees: UserSummary[];
  pipelines: Pipeline[];
  stages: Stage[];
  initialValue?: Deal;
  lockedPipelineId?: string;
  onSaved(deal: Deal): void;
}

export function DealForm({ mode, contacts, assignees, pipelines, stages, initialValue, lockedPipelineId, onSaved }: DealFormProps) {
  const form = useForm<DealFormInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: initialValue?.title ?? '',
      contactId: initialValue?.contactId ?? contacts[0]?.id ?? '',
      pipelineId: lockedPipelineId ?? initialValue?.pipelineId ?? pipelines[0]?.id ?? '',
      stageId: initialValue?.stageId ?? stages[0]?.id ?? '',
      value: initialValue?.value,
      currency: initialValue?.currency ?? 'BRL',
      expectedCloseDate: initialValue?.expectedCloseDate,
      assigneeId: initialValue?.assigneeId,
      tags: initialValue?.tags ?? []
    }
  });

  const onSubmit = form.handleSubmit(async (values) => {
    const payload = { ...values, description: initialValue?.description };
    const deal = mode === 'create' ? await dealsApi.createDeal(payload) : await dealsApi.updateDeal(initialValue!.id, payload);
    onSaved(deal);
  });

  return (
    <form className="space-y-3" onSubmit={(event) => void onSubmit(event)}>
      <input className="w-full rounded border p-2" placeholder="Título" {...form.register('title')} />
      <select className="w-full rounded border p-2" {...form.register('contactId')}>
        {contacts.map((contact) => (
          <option key={contact.id} value={contact.id}>{contact.name ?? contact.email ?? contact.phone ?? contact.id}</option>
        ))}
      </select>
      <select className="w-full rounded border p-2" disabled={Boolean(lockedPipelineId)} {...form.register('pipelineId')}>
        {pipelines.map((pipeline) => (
          <option key={pipeline.id} value={pipeline.id}>{pipeline.name}</option>
        ))}
      </select>
      <select className="w-full rounded border p-2" {...form.register('stageId')}>
        {stages.map((stage) => (
          <option key={stage.id} value={stage.id}>{stage.name}</option>
        ))}
      </select>
      <input className="w-full rounded border p-2" type="number" step="0.01" placeholder="Valor" {...form.register('value', { valueAsNumber: true })} />
      <select className="w-full rounded border p-2" {...form.register('assigneeId')}>
        <option value="">Sem responsável</option>
        {assignees.map((assignee) => (
          <option key={assignee.id} value={assignee.id}>{assignee.name}</option>
        ))}
      </select>
      <button type="submit" className="rounded bg-slate-900 px-3 py-2 text-white">{mode === 'create' ? 'Criar deal' : 'Salvar deal'}</button>
    </form>
  );
}
