type TechCardProps = {
  label: string;
  role: string;
};

export function TechCard({ label, role }: TechCardProps) {
  return (
    <div className="surface-card flex flex-col gap-1 p-5">
      <dt className="text-regular-semibold">{label}</dt>
      <dd className="text-muted-foreground text-sm">{role}</dd>
    </div>
  );
}
