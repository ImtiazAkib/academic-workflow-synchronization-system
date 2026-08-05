type RoadmapRowProps = {
  phase: string;
  activity: string;
  duration: string;
};

export function RoadmapRow({ phase, activity, duration }: RoadmapRowProps) {
  return (
    <li className="surface-card flex flex-col gap-2 p-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
        <span className="text-primary text-regular-semibold w-24 shrink-0">{phase}</span>
        <span className="text-regular-normal">{activity}</span>
      </div>

      <span className="bg-secondary text-secondary-foreground w-fit rounded-full px-3 py-1 text-xs font-medium">{duration}</span>
    </li>
  );
}
