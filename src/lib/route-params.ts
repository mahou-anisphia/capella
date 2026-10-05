/** Positive integer ids from dynamic route segments; anything else is a 404. */
export function parseId(segment: string): number | null {
  const id = Number(segment);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}
