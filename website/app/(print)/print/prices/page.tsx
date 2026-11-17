// Dev-only price list PDF export: the real price list section on its own, printed by /prices.pdf.
import { notFound } from "next/navigation";
import { PriceList } from "@/components/sections/PriceList";
import { SiteViewProvider } from "@/components/site/SiteViewProvider";
import { getSiteView } from "@/lib/content/published";

export default async function PrintPrices() {
  if (process.env.NODE_ENV !== "development") notFound();
  return (
    <SiteViewProvider view={await getSiteView()}>
      <PriceList />
    </SiteViewProvider>
  );
}
