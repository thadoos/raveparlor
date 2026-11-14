import { formatUkPhone } from "@/lib/content/normalize";
import { CATEGORY_KEYS, IMAGE_SLOTS } from "@/lib/content/schema";
import type { CategoryKey, ImageRef, ImageSlot, SiteContent } from "@/lib/content/schema";
import { IMAGE_POSITIONS, MENU_STRUCTURE } from "@/lib/content/structure";
import { SITE } from "@/lib/data/site";
import type { SiteInfo } from "@/lib/data/site";
import type { MenuCategory, MenuItem } from "@/lib/data/services";

/** Turns the content document into the shapes the components render. Pure: no I/O. */

export interface ResolvedImage {
  src: string;
  alt: string;
  width: number;
  height: number;
  position?: string;
}

export interface SiteView {
  site: SiteInfo;
  menu: Record<CategoryKey, MenuCategory>;
  images: Record<ImageSlot, ResolvedImage>;
}

/** Paths starting with "/" are bundled files; anything else is an object in the public storage bucket. */
export function resolveImage(ref: ImageRef, supabaseUrl: string, position?: string): ResolvedImage {
  const src = ref.path.startsWith("/")
    ? ref.path
    : `${supabaseUrl}/storage/v1/object/public/site-images/${ref.path}`;
  const image: ResolvedImage = { src, alt: ref.alt, width: ref.width, height: ref.height };
  if (position !== undefined) image.position = position;
  return image;
}

/** The lowest £ amount in any of the price strings, e.g. ["£100 – £220+"] gives "£100". */
export function deriveFrom(prices: readonly string[]): string {
  const amounts = prices.flatMap((price) => Array.from(price.matchAll(/£(\d+)/g), (m) => Number(m[1])));
  return amounts.length > 0 ? `£${Math.min(...amounts)}` : "–";
}

function buildItem(content: SiteContent, category: CategoryKey, itemIndex: number): MenuItem {
  const structure = MENU_STRUCTURE[category].items[itemIndex];
  const data = content.services[category].items[structure.key];
  if (!data) throw new Error(`Missing content for ${category}.${structure.key}`);

  const note = data.note ?? (structure.chemicalNote ? content.sharedNotes.chemical : undefined);
  const base = { key: structure.key, name: structure.name, desc: data.desc, ideal: data.ideal };
  const extras = {
    ...(structure.single ? { single: true } : {}),
    ...(note !== undefined ? { note } : {}),
  };

  if (structure.kind === "barberTable") {
    return {
      ...base,
      ...extras,
      cols: structure.cols,
      rows: content.barbers.map((barber) => ({
        label: barber.name,
        sub: barber.days,
        prices: barber.cutPrices,
        barberId: barber.id,
      })),
      from: deriveFrom(content.barbers.flatMap((barber) => barber.cutPrices)),
    };
  }
  if (structure.kind === "table") {
    const prices = data.prices ?? [];
    return { ...base, ...extras, cols: structure.cols, prices, from: deriveFrom(prices) };
  }
  const range = data.range ?? "";
  return { ...base, ...extras, range, from: deriveFrom([range]) };
}

export function buildMenu(
  content: SiteContent,
  images: Record<ImageSlot, ResolvedImage>,
): Record<CategoryKey, MenuCategory> {
  const entries = CATEGORY_KEYS.map((key) => {
    const structure = MENU_STRUCTURE[key];
    const category: MenuCategory = {
      name: structure.name,
      images: [images[`dialog.${key}.0`], images[`dialog.${key}.1`]],
      media: images[`media.${key}`],
      intro: content.services[key].intro,
      items: structure.items.map((_, index) => buildItem(content, key, index)),
    };
    if (structure.barbers) category.barbers = content.barbers;
    return [key, category] as const;
  });
  return Object.fromEntries(entries) as Record<CategoryKey, MenuCategory>;
}

export function buildSiteInfo(content: SiteContent): SiteInfo {
  return {
    ...SITE,
    hours: content.business.hours,
    whatsappNumber: content.business.defaultWhatsApp,
    phoneDisplay: formatUkPhone(content.business.defaultWhatsApp),
  };
}

export function buildSiteView(content: SiteContent, supabaseUrl: string): SiteView {
  const images = Object.fromEntries(
    IMAGE_SLOTS.map((slot) => [slot, resolveImage(content.images[slot], supabaseUrl, IMAGE_POSITIONS[slot])]),
  ) as Record<ImageSlot, ResolvedImage>;
  return { site: buildSiteInfo(content), menu: buildMenu(content, images), images };
}
