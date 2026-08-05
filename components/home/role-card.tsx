import { Check } from 'lucide-react';

import { RoleCardItem } from '@/types';

import { cn } from '@/lib/utils';

type RoleCardProps = {
  item: RoleCardItem;
};

export function RoleCard({ item }: RoleCardProps) {
  const Icon = item.icon;

  return (
    <article className="surface-card flex flex-col gap-4 p-6">
      <span className={cn('flex size-11 items-center justify-center rounded-lg', item.surfaceClassName)}>
        <Icon className={cn('size-5', item.accentClassName)} />
      </span>

      <div className="flex flex-col gap-1.5">
        <h3 className="text-xl md:text-2xl">{item.title}</h3>
        <p className="text-muted-foreground text-sm">{item.summary}</p>
      </div>

      <ul className="flex flex-col gap-2.5">
        {item.capabilities.map(capability => (
          <li key={capability} className="text-regular-normal flex items-start gap-2.5 text-sm">
            <Check className={cn('mt-0.5 size-4 shrink-0', item.accentClassName)} />
            <span className="text-foreground/90">{capability}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}
