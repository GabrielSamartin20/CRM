import { ReactNode } from 'react';

export function Sheet({ open, onOpenChange, children }: { open: boolean; onOpenChange: (open: boolean) => void; children: ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/30" onClick={() => onOpenChange(false)}>
      {children}
    </div>
  );
}

export function SheetContent({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={`absolute right-0 top-0 h-full bg-white shadow-xl ${className ?? ''}`}>{children}</div>;
}
