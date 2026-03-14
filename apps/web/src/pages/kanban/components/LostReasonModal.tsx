import { useState } from 'react';
import { Dialog, DialogContent } from '../../../components/ui/Dialog';

export interface LostReasonValue {
  reason: string;
  details?: string;
}

interface LostReasonModalProps {
  open: boolean;
  onClose(): void;
  onConfirm(value: LostReasonValue): void;
}

const reasons = ['sem_budget', 'sem_necessidade', 'perdeu_concorrente', 'sem_resposta', 'timing', 'outro'];

export function LostReasonModal({ open, onClose, onConfirm }: LostReasonModalProps) {
  const [reason, setReason] = useState<string>('sem_budget');
  const [details, setDetails] = useState<string>('');

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <div className="space-y-3 p-2">
          <h2 className="text-lg font-semibold">Motivo de perda</h2>
          <select value={reason} onChange={(event) => setReason(event.target.value)} className="w-full rounded border p-2">
            {reasons.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <textarea
            value={details}
            onChange={(event) => setDetails(event.target.value)}
            className="w-full rounded border p-2"
            placeholder="Detalhes (opcional)"
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded border px-3 py-1">
              Cancelar
            </button>
            <button type="button" onClick={() => onConfirm({ reason, details })} className="rounded bg-slate-900 px-3 py-1 text-white">
              Confirmar
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
