export function StatTile({
  label,
  value,
  caption,
}: {
  label: string;
  value: React.ReactNode;
  caption?: string;
}) {
  return (
    <div className="bg-card ring-border shadow-surface flex flex-col gap-1 rounded-xl p-3 ring-1">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className="flex items-baseline gap-1.5">
        <span className="font-heading text-xl font-semibold tabular-nums">
          {value}
        </span>
        {caption && (
          <span className="text-muted-foreground text-xs">{caption}</span>
        )}
      </span>
    </div>
  );
}
