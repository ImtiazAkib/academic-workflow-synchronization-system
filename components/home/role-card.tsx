import { Check } from 'lucide-react';

import { RoleVisual } from '@/types';

import { cn } from '@/lib/utils';

type RoleCardProps = {
  visual: RoleVisual;
  title: string;
  summary: string;
  capabilities: readonly string[];
};

export function RoleCard({ visual, title, summary, capabilities }: RoleCardProps) {
  const Icon = visual.icon;

  return (
    <article className="surface-card flex flex-col gap-4 p-6">
      <span className={cn('flex size-11 items-center justify-center rounded-lg', visual.surfaceClassName)}>
        <Icon className={cn('size-5', visual.accentClassName)} />
      </span>

      <div className="flex flex-col gap-1.5">
        <h3 className="text-xl md:text-2xl">{title}</h3>
        <p className="text-muted-foreground text-sm">{summary}</p>
      </div>

      <ul className="flex flex-col gap-2.5">
        {capabilities.map(x => (
          <li key={x} className="text-regular-normal flex items-start gap-2.5 text-sm">
            <Check className={cn('mt-0.5 size-4 shrink-0', visual.accentClassName)} />
            <span className="text-foreground/90">{x}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}
