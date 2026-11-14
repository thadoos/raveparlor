import type { MetadataRoute } from "next";
import { SITE_STATIC } from "@/lib/data/site";

/** Colours match the `--color-paper` / `--color-ink` tokens in app/styles/tokens.css. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_STATIC.brandName,
    short_name: "Rave’s Parlor",
    description: `Hair salon in ${SITE_STATIC.address.town}, London.`,
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#111111",
    icons: [
      { src: "/icon.png", sizes: "512x512", type: "image/png" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
