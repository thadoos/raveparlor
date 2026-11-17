import type { OpeningHours } from "@/lib/content/schema";
/** Business details shared by every component. Server-safe: no side effects, no browser APIs. */

export interface Address {
  street: string;
  town: string;
  postcode: string;
}

export type { DayOfWeek, OpeningHours } from "@/lib/content/schema";

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
  /** Salon location (static, not editable content). */
  geo: { latitude: number; longitude: number };
  /** First year shown in the copyright line (kept as data: no `new Date()` in server components). */
  copyrightStartYear: string;
}

/** The site details that are not editable content (hours, the WhatsApp number and the Google rating come from the content document). */
export type StaticSiteInfo = Omit<
  SiteInfo,
  "hours" | "whatsappNumber" | "phoneDisplay" | "googleRating"
>;

export const SITE_STATIC: StaticSiteInfo = {
  brandName: "Rave’s Parlor London",
  address: {
    street: "15 Coombe Road",
    town: "New Malden",
    postcode: "KT3 4QG",
  },
  closedDays: ["Christmas Day", "Boxing Day", "New Year’s Day"],
  instagramUrl: "https://www.instagram.com/ravesparlor_london",
  mapsUrl: "https://maps.app.goo.gl/5DsbgsoeiHCW4rab9",
  geo: { latitude: 51.404722013891806, longitude: -0.2568717066286711 },
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
