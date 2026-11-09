/** Business details shared by every component. Server-safe: no side effects, no browser APIs. */

/** Business WhatsApp number, in international format without the plus. */
export const WHATSAPP_NUMBER = "447789096148";

export interface Address {
  street: string;
  town: string;
  postcode: string;
}

export interface OpeningHours {
  /** Full label, e.g. "Mon – Sat" or "Sunday". */
  days: string;
  /** Abbreviated label for tight spaces, e.g. "Mon – Sat" or "Sun". */
  shortDays: string;
  open: string;
  close: string;
  lastAppointment: string;
}

export interface GoogleRating {
  score: string;
  reviews: number;
}

export interface SiteInfo {
  brandName: string;
  address: Address;
  /** Phone number as shown to visitors (also the WhatsApp number). */
  phoneDisplay: string;
  whatsappNumber: string;
  hours: readonly OpeningHours[];
  /** Days the salon is closed, e.g. "Christmas Day". */
  closedDays: readonly string[];
  googleRating: GoogleRating;
  instagramUrl: string;
  mapsUrl: string;
  /** First year shown in the copyright line (kept as data: no `new Date()` in server components). */
  copyrightStartYear: string;
}

export const SITE: SiteInfo = {
  brandName: "Rave’s Parlor London",
  address: {
    street: "15 Coombe Road",
    town: "New Malden",
    postcode: "KT3 4QG",
  },
  phoneDisplay: "07789 096148",
  whatsappNumber: WHATSAPP_NUMBER,
  hours: [
    {
      days: "Mon – Sat",
      shortDays: "Mon – Sat",
      open: "10:00",
      close: "19:00",
      lastAppointment: "18:00",
    },
    {
      days: "Sunday",
      shortDays: "Sun",
      open: "10:00",
      close: "18:00",
      lastAppointment: "17:00",
    },
  ],
  closedDays: ["Christmas Day", "Boxing Day", "New Year’s Day"],
  googleRating: { score: "4.9", reviews: 200 },
  instagramUrl: "https://www.instagram.com/ravesparlor_london",
  mapsUrl: "https://maps.app.goo.gl/5DsbgsoeiHCW4rab9",
  copyrightStartYear: "2026",
};
