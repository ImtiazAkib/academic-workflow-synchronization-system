type HeroStatProps = {
  value: string;
  label: string;
};

export function HeroStat({ value, label }: HeroStatProps) {
  return (
    <div className="surface-card flex flex-col items-center gap-1 px-4 py-5">
      <dt className="font-heading text-3xl font-bold tracking-tight">{value}</dt>
      <dd className="text-muted-foreground text-sm">{label}</dd>
    </div>
  );
}
