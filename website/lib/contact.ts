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
 * Message for a service's WhatsApp link. `chooseBarber` is true for services where the customer
 * picks a barber; `barber` is null for "no preference".
 */
export function serviceMessage(service: string, barber: string | null, chooseBarber: boolean) {
  if (!chooseBarber) return `Hi, I'd like to book ${service}.`;
  if (barber) return `Hi, I'd like to book ${service} with ${barber}.`;
  return `Hi, I'd like to book ${service}. Any barber is fine.`;
}
