import type { CategoryKey } from "@/lib/data/services";

/** The site photos, each with its default alt text. */

export interface Photo {
  src: string;
  alt: string;
}

export const PHOTOS = {
  portraitColour: {
    src: "/images/portrait-colour.jpg",
    alt: "Client with a sleek shoulder-length cut on a rooftop at golden hour",
  },
  bobCopper: {
    src: "/images/bob-copper.jpg",
    alt: "Client with a copper bob, eyes lowered",
  },
  portraitMono: {
    src: "/images/portrait-mono.jpg",
    alt: "Black and white profile portrait of a client",
  },
  parlorReception: {
    src: "/images/parlor-reception.jpg",
    alt: "Rave’s Parlor reception desk and salon floor",
  },
  priceList: {
    src: "/images/price-list.webp",
    alt: "Rave’s Parlor London price list: hair cut and blow-dry prices for Rave, John and Julian, colour and highlights, perm, and hair treatments. All chemical services exclude haircut, wash and finishing.",
  },
} as const satisfies Record<string, Photo>;

export type PhotoKey = keyof typeof PHOTOS;

/** CSS `object-position` for each photo in the full-screen slides. */
export const SLIDE_POSITIONS = {
  heroLeft: "46% 42%",
  heroRight: "50% 38%",
  split: "50% 40%",
  parlor: "50% 50%",
} as const;

export interface OverviewCardImage {
  photo: PhotoKey;
  objectPosition: string;
}

/** Photo and `object-position` for each category card in the services overview. */
export const OVERVIEW_IMAGES: Record<CategoryKey, OverviewCardImage> = {
  cut: { photo: "portraitColour", objectPosition: "50% 30%" },
  colour: { photo: "bobCopper", objectPosition: "50% 50%" },
  perm: { photo: "portraitMono", objectPosition: "50% 40%" },
  treat: { photo: "parlorReception", objectPosition: "40% 50%" },
};
