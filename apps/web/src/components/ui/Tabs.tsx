import { ReactNode, useState } from 'react';

export function Tabs({ defaultValue, children }: { defaultValue: string; children: ReactNode }) {
  return <div data-default={defaultValue}>{children}</div>;
}

export function TabsList({ children }: { children: ReactNode }) {
  return <div className="mb-2 flex gap-2">{children}</div>;
}

export function TabsTrigger({ value, children, onClick }: { value: string; children: ReactNode; onClick?: (value: string) => void }) {
  return (
    <button className="rounded border px-2 py-1 text-xs" onClick={() => onClick?.(value)} type="button">
      {children}
    </button>
  );
}

export function TabsContent({ children }: { value: string; children: ReactNode }) {
  const [render] = useState(true);
  return render ? <div>{children}</div> : null;
}
