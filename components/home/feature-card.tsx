import { FeatureVisual } from '@/types';

import { cn } from '@/lib/utils';

type FeatureCardProps = {
  visual: FeatureVisual;
  title: string;
  description: string;
};

export function FeatureCard({ visual, title, description }: FeatureCardProps) {
  const Icon = visual.icon;

  return (
    <article className="surface-card flex flex-col gap-3 p-6">
      <Icon className={cn('size-6', visual.accentClassName)} />

      <h3 className="text-lg md:text-xl">{title}</h3>

      <p className="text-muted-foreground text-sm">{description}</p>
    </article>
  );
}
