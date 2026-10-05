/** "1 day", "3 days" */
export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}

export const SKIP_REASON_LABELS = {
  tired: "Tired",
  sick: "Sick",
  busy: "Busy",
  travel: "Travel",
} as const;
