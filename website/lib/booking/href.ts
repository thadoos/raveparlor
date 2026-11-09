import { serviceMessage, whatsappLink } from "@/lib/contact";
import type { MenuCategory, MenuItem } from "@/lib/data/services";
import type { Selection } from "./picker";

export interface BookingOptions {
  item: MenuItem;
  category: MenuCategory;
  /** What the visitor picked, or null when nothing is picked (or the service has no choices). */
  selection: Selection | null;
}

/** The WhatsApp message for a service and the current selection. */
export function bookingMessage({ item, category, selection }: BookingOptions): string {
  return serviceMessage({
    service: item.name,
    barber: selection?.barber ?? null,
    chooseBarber: !!category.barbers,
    cut: selection?.cut ?? null,
  });
}

/** The WhatsApp link for a service and the current selection. */
export function bookingHref(options: BookingOptions): string {
  return whatsappLink(bookingMessage(options));
}
