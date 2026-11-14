import { serviceMessage, whatsappLink } from "@/lib/contact";
import type { MenuCategory, MenuItem } from "@/lib/data/services";
import type { Selection } from "./picker";

export interface BookingOptions {
  item: MenuItem;
  category: MenuCategory;
  /** What the visitor picked, or null when nothing is picked (or the service has no choices). */
  selection: Selection | null;
  /** The number to message when no barber is chosen. */
  defaultWhatsApp: string;
}

function selectedBarber({ category, selection }: BookingOptions) {
  const id = selection?.barberId;
  return id ? category.barbers?.find((barber) => barber.id === id) : undefined;
}

/** The WhatsApp message for a service and the current selection. */
export function bookingMessage(options: BookingOptions): string {
  const { item, category, selection } = options;
  return serviceMessage({
    service: item.name,
    barber: selectedBarber(options)?.name ?? null,
    chooseBarber: !!category.barbers,
    cut: selection?.cut ?? null,
  });
}

/** The WhatsApp link for a service and the current selection (to the chosen barber if any). */
export function bookingHref(options: BookingOptions): string {
  return whatsappLink(
    selectedBarber(options)?.whatsApp ?? options.defaultWhatsApp,
    bookingMessage(options),
  );
}
