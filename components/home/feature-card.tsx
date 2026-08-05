import { FeatureItem } from '@/types';

import { cn } from '@/lib/utils';

type FeatureCardProps = {
  item: FeatureItem;
};

export function FeatureCard({ item }: FeatureCardProps) {
  const Icon = item.icon;

  return (
    <article className="surface-card flex flex-col gap-3 p-6">
      <Icon className={cn('size-6', item.accentClassName)} />

      <h3 className="text-lg md:text-xl">{item.title}</h3>

      <p className="text-muted-foreground text-sm">{item.description}</p>
    </article>
  );
}
