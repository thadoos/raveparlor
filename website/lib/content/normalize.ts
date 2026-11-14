/** Input normalizers for the admin editors. Pure functions: no side effects, no browser APIs. */

const PRICE_PATTERN = /^£?\s*(\d+)(\+?)\s*(?:[-–]\s*£?\s*(\d+)(\+?))?$/;
const WHATSAPP_PATTERN = /^[1-9]\d{7,14}$/;

/** Returns the digits-only international form (e.g. "447789096148"), or null when invalid. */
export function normalizeWhatsApp(input: string): string | null {
  const cleaned = input.replace(/\(0\)/g, "").replace(/[\s\-.()]/g, "");
  const international = cleaned.startsWith("+");
  const body = international ? cleaned.slice(1) : cleaned;
  if (!/^\d+$/.test(body)) return null;

  let digits: string;
  if (international) digits = body;
  else if (body.startsWith("00")) digits = body.slice(2);
  else if (/^0\d{10}$/.test(body)) digits = `44${body.slice(1)}`;
  else digits = body;

  return WHATSAPP_PATTERN.test(digits) ? digits : null;
}

/** Returns the canonical price ("£80", "£100 – £220+" or a lone "–"), or null when invalid. */
export function normalizePrice(input: string): string | null {
  const text = input.trim();
  if (text === "-" || text === "–") return "–";
  const match = PRICE_PATTERN.exec(text);
  if (!match) return null;
  const [, from, fromPlus, to, toPlus] = match;
  const start = `£${from}${fromPlus}`;
  return to === undefined ? start : `${start} – £${to}${toPlus}`;
}

/** Formats normalized digits for display: UK numbers as "07789 096148", others as "+digits". */
export function formatUkPhone(digits: string): string {
  if (/^44\d{10}$/.test(digits)) {
    const national = `0${digits.slice(2)}`;
    return `${national.slice(0, 5)} ${national.slice(5)}`;
  }
  return `+${digits}`;
}
