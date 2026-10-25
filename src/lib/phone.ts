/** Somali mobile numbers: stored as +2526XXXXXXXX. */
export const SOMALI_MOBILE = /^\+2526\d{8}$/;

/**
 * Accepts 061 234 5678, 61-234-5678, 252612345678 or +252 61 234 5678 and
 * returns +252612345678, or null when it is not a Somali mobile number.
 */
export function normalizeSomaliPhone(input: string): string | null {
  let digits = input.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) digits = digits.slice(1);
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("252")) digits = digits.slice(3);
  if (digits.startsWith("0")) digits = digits.slice(1);
  const normalized = `+252${digits}`;
  return SOMALI_MOBILE.test(normalized) ? normalized : null;
}

/** +252612345678 → +252 61 234 5678 (other numbers are returned as given). */
export function whatsappDisplay(phone: string) {
  const match = phone.replace(/\s/g, "").match(/^\+252(\d{2})(\d{3})(\d{4})$/);
  return match ? `+252 ${match[1]} ${match[2]} ${match[3]}` : phone;
}

export function whatsappLink(phone: string, text?: string) {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}
