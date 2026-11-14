import { formatUkPhone } from "@/lib/content/normalize";
import { CATEGORY_KEYS, IMAGE_SLOTS } from "@/lib/content/schema";
import { allCells, priceRows, rowsIdentical } from "@/lib/content/prices";
import type { Barber, CategoryKey, ImageRef, ImageSlot, SiteContent } from "@/lib/content/schema";
import { IMAGE_POSITIONS, MENU_STRUCTURE } from "@/lib/content/structure";
import { SITE_STATIC } from "@/lib/data/site";
import type { SiteInfo } from "@/lib/data/site";
import type { MenuCategory, MenuItem, PriceRow } from "@/lib/data/services";

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
  /** The barbers, in display order (booking looks up the chosen barber's name and number here). */
  barbers: readonly Barber[];
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
  const amounts = prices.flatMap((price) =>
    Array.from(price.matchAll(/£(\d+)/g), (m) => Number(m[1])),
  );
  return amounts.length > 0 ? `£${Math.min(...amounts)}` : "–";
}

function buildItem(
  content: SiteContent,
  category: CategoryKey,
  itemIndex: number,
  supabaseUrl: string,
): MenuItem {
  const structure = MENU_STRUCTURE[category].items[itemIndex];
  const items = content.services[category].items;
  const data = Object.hasOwn(items, structure.key) ? items[structure.key] : undefined;
  if (!data) throw new Error(`Missing content for ${category}.${structure.key}`);

  const note = data.note ?? (structure.chemicalNote ? content.sharedNotes.chemical : undefined);
  const barbers = new Map(content.barbers.map((barber) => [barber.id, barber]));
  const stored = priceRows(data, content.barbers);
  const rows: PriceRow[] = stored.map(({ barberId, prices }) => {
    const barber = barberId === null ? undefined : barbers.get(barberId);
    return { label: barber?.name ?? "", sub: barber?.days ?? "", prices, barberId };
  });
  return {
    key: structure.key,
    name: structure.name,
    options: [...data.options],
    byBarber: data.byBarber,
    rows,
    collapsed: data.byBarber && rowsIdentical(stored),
    from: deriveFrom(allCells(data, content.barbers)),
    ...(structure.single ? { single: true } : {}),
    desc: data.desc,
    ideal: data.ideal,
    ...(note !== undefined ? { note } : {}),
    photos: data.photos.map((photo) => resolveImage(photo, supabaseUrl)),
  };
}

export function buildMenu(
  content: SiteContent,
  images: Record<ImageSlot, ResolvedImage>,
  supabaseUrl: string,
): Record<CategoryKey, MenuCategory> {
  const entries = CATEGORY_KEYS.map((key) => {
    const structure = MENU_STRUCTURE[key];
    const category: MenuCategory = {
      name: structure.name,
      media: images[`media.${key}`],
      intro: content.services[key].intro,
      items: structure.items.map((_, index) => buildItem(content, key, index, supabaseUrl)),
    };
    return [key, category] as const;
  });
  return Object.fromEntries(entries) as Record<CategoryKey, MenuCategory>;
}

export function buildSiteInfo(content: SiteContent): SiteInfo {
  return {
    ...SITE_STATIC,
    hours: content.business.hours,
    whatsappNumber: content.business.defaultWhatsApp,
    phoneDisplay: formatUkPhone(content.business.defaultWhatsApp),
  };
}

export function buildSiteView(content: SiteContent, supabaseUrl: string): SiteView {
  const images = Object.fromEntries(
    IMAGE_SLOTS.map((slot) => [
      slot,
      resolveImage(content.images[slot], supabaseUrl, IMAGE_POSITIONS[slot]),
    ]),
  ) as Record<ImageSlot, ResolvedImage>;
  return {
    site: buildSiteInfo(content),
    menu: buildMenu(content, images, supabaseUrl),
    barbers: content.barbers,
    images,
  };
}
