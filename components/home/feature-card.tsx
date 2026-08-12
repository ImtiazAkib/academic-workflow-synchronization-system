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
    <article className="surface-card flex flex-col gap-4 rounded-2xl p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/5">
      <span className={cn('flex size-11 items-center justify-center rounded-xl', visual.surfaceClassName)}>
        <Icon className={cn('size-5', visual.accentClassName)} />
      </span>

      <h3 className="text-lg md:text-xl">{title}</h3>

      <p className="text-muted-foreground text-sm">{description}</p>
    </article>
  );
}
