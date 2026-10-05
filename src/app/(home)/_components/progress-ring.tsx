import { FORTNIGHT_DAYS } from "~/lib/dates";

const SIZE = 132;
const STROKE = 12;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * Primary stroke on a secondary track, with the count in the middle (the ring colour alone is weak
 * in light mode). The small dot marks where an even pace would be today.
 */
export function ProgressRing({
  count,
  target,
  elapsedDays,
  evenPace,
}: {
  count: number;
  target: number;
  elapsedDays: number;
  evenPace: number;
}) {
  const progress = Math.min(1, count / target);
  const paceAngle = (elapsedDays / FORTNIGHT_DAYS) * 2 * Math.PI;
  const center = SIZE / 2;
  const marker = {
    x: center + RADIUS * Math.sin(paceAngle),
    y: center - RADIUS * Math.cos(paceAngle),
  };

  return (
    <div
      className="relative shrink-0"
      style={{ width: SIZE, height: SIZE }}
      role="img"
      aria-label={`${count} of ${target} this fortnight. Even pace would be ${evenPace} by today.`}
    >
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        <circle
          cx={center}
          cy={center}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE}
          className="stroke-secondary"
        />
        {progress > 0 && (
          <circle
            cx={center}
            cy={center}
            r={RADIUS}
            fill="none"
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={`${progress * CIRCUMFERENCE} ${CIRCUMFERENCE}`}
            transform={`rotate(-90 ${center} ${center})`}
            className="stroke-primary transition-[stroke-dasharray] duration-500"
          />
        )}
        <circle
          cx={marker.x}
          cy={marker.y}
          r={4}
          strokeWidth={2}
          className="fill-foreground stroke-card"
        >
          <title>Even pace</title>
        </circle>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-heading text-2xl font-semibold tabular-nums">
          {count} / {target}
        </span>
        <span className="text-muted-foreground text-xs">this fortnight</span>
      </div>
    </div>
  );
}
