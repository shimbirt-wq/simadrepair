/** SIMAD university IDs: letters then digits, e.g. CS383833. */
export const UNIVERSITY_ID_PATTERN = /^[A-Z]{1,6}[0-9]{3,10}$/;

export function normalizeUniversityId(input: string): string | null {
  const normalized = input.trim().toUpperCase().replace(/[\s-]/g, "");
  return UNIVERSITY_ID_PATTERN.test(normalized) ? normalized : null;
}
