/** Business WhatsApp number, in international format without the plus. */
export const WHATSAPP_NUMBER = "447789096148";

/** Opens a chat with the salon; `message` pre-fills the text box (the customer still presses send). */
export function whatsappLink(message?: string) {
  const base = `https://wa.me/${WHATSAPP_NUMBER}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

/** Message for the general "book" links (menu, footer, book section). */
export const BOOK_MESSAGE = "Hi, I'd like to book an appointment at Rave's Parlor.";

/**
 * Message for a service's WhatsApp link. `chooseBarber` is true only for services with per-barber
 * prices; `barber` is null for "no preference"; `cut` is the chosen cut type, e.g. "Gentleman".
 */
export function serviceMessage(
  service: string,
  barber: string | null,
  chooseBarber: boolean,
  cut: string | null = null,
) {
  if (!chooseBarber) return `Hi, I'd like to book ${service}.`;
  const what = cut ? `${service} (${cut})` : service;
  if (barber) return `Hi, I'd like to book ${what} with ${barber}.`;
  return `Hi, I'd like to book ${what}. Any barber is fine.`;
}
