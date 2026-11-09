import { WHATSAPP_NUMBER } from "@/lib/data/site";

export { WHATSAPP_NUMBER };

/** Opens a chat with the salon; `message` pre-fills the text box (the customer still presses send). */
export function whatsappLink(message?: string) {
  const base = `https://wa.me/${WHATSAPP_NUMBER}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

/** Message for the general "book" links (menu, footer, book section). */
export const BOOK_MESSAGE = "Hi, I'd like to book an appointment at Rave's Parlor.";

export interface ServiceMessageOptions {
  /** Service name, e.g. "Cutting & Finishing". */
  service: string;
  /** The chosen barber, or null for "no preference". Only used when `chooseBarber` is true. */
  barber: string | null;
  /** True only for services with per-barber prices. */
  chooseBarber: boolean;
  /** The chosen cut type or hair length, e.g. "Gentleman" or "Medium length" (with or without a barber). */
  cut?: string | null;
}

/** Message for a service's WhatsApp link. */
export function serviceMessage({
  service,
  barber,
  chooseBarber,
  cut = null,
}: ServiceMessageOptions) {
  // "&" in a wa.me link can be mangled on the way into the WhatsApp app, so spell it out
  const name = service.replace(/ & /g, " and ");
  const what = cut ? `${name} (${cut})` : name;
  if (!chooseBarber) return `Hi, I'd like to book ${what}.`;
  if (barber) return `Hi, I'd like to book ${what} with ${barber}.`;
  return `Hi, I'd like to book ${what}. Any barber is fine.`;
}
