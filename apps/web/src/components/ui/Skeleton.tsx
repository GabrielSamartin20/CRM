import { HTMLAttributes } from 'react';

export function Skeleton(props: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={`animate-pulse rounded bg-slate-200 ${props.className ?? ''}`} />;
}
