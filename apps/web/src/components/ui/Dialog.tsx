import { ReactNode } from 'react';

export function Dialog({ open, onOpenChange, children }: { open: boolean; onOpenChange: (open: boolean) => void; children: ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => onOpenChange(false)}>
      {children}
    </div>
  );
}

export function DialogContent({ children }: { children: ReactNode }) {
  return <div className="w-full max-w-lg rounded bg-white p-4 shadow" onClick={(event) => event.stopPropagation()}>{children}</div>;
}
