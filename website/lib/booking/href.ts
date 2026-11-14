import { serviceMessage, whatsappLink } from "@/lib/contact";
import type { Barber, MenuItem } from "@/lib/data/services";
import type { Selection } from "./picker";

export interface BookingOptions {
  item: MenuItem;
  /** What the visitor picked, or null when nothing is picked (or the service has no choices). */
  selection: Selection | null;
  /** All barbers, to look up the chosen one. */
  barbers: readonly Barber[];
  /** The number to message when no barber is chosen. */
  defaultWhatsApp: string;
}

function selectedBarber({ barbers, selection }: BookingOptions) {
  const id = selection?.barberId;
  return id ? barbers.find((barber) => barber.id === id) : undefined;
}

/** The WhatsApp message for a service and the current selection. */
export function bookingMessage(options: BookingOptions): string {
  const { item, selection } = options;
  return serviceMessage({
    service: item.name,
    barber: selectedBarber(options)?.name ?? null,
    chooseBarber: item.byBarber,
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
