/** Business details shared by every component. Server-safe: no side effects, no browser APIs. */

/** Business WhatsApp number, in international format without the plus. */
export const WHATSAPP_NUMBER = "447789096148";

export interface Address {
  street: string;
  town: string;
  postcode: string;
}

export type DayOfWeek =
  "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";

export interface OpeningHours {
  /** The days these hours apply to (structured counterpart of `days`, used for JSON-LD). */
  dayOfWeek: readonly DayOfWeek[];
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
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      days: "Mon – Sat",
      shortDays: "Mon – Sat",
      open: "10:00",
      close: "19:00",
      lastAppointment: "18:00",
    },
    {
      dayOfWeek: ["Sunday"],
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

export interface SiteUrlEnv {
  NEXT_PUBLIC_SITE_URL?: string;
  /** Set by Vercel to the production domain, without a protocol. */
  VERCEL_PROJECT_PRODUCTION_URL?: string;
}

const LOCAL_SITE_URL = "http://localhost:3000";

/**
 * The canonical origin of the site, without a trailing slash: `NEXT_PUBLIC_SITE_URL` if set, else
 * the Vercel production domain, else the local dev server.
 */
export function resolveSiteUrl(env: SiteUrlEnv): string {
  const explicit = env.NEXT_PUBLIC_SITE_URL?.trim();
  const vercel = env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  const url = explicit || (vercel ? `https://${vercel}` : LOCAL_SITE_URL);
  return url.replace(/\/+$/, "");
}

/** Read the variables by their literal names so Next can inline the public one. */
export const SITE_URL = resolveSiteUrl({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  VERCEL_PROJECT_PRODUCTION_URL: process.env.VERCEL_PROJECT_PRODUCTION_URL,
});
