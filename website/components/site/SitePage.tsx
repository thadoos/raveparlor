import { Deck } from "@/components/deck/Deck";
import { AppShell } from "@/components/layout/AppShell";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { BookVisit } from "@/components/sections/BookVisit";
import { PriceList } from "@/components/sections/PriceList";
import { ServiceDialog } from "@/components/services/ServiceDialog";
import { ServiceMenu } from "@/components/services/ServiceMenu";
import { ServicesOverview } from "@/components/services/ServicesOverview";
import { ServicesProvider } from "@/components/services/ServicesProvider";
import { HeroPair } from "@/components/slides/HeroPair";
import { ParlorSlide } from "@/components/slides/ParlorSlide";
import { ReviewsSlide } from "@/components/slides/ReviewsSlide";
import { SplitSlide } from "@/components/slides/SplitSlide";
import type { SiteView } from "@/lib/content/view";
import { SiteViewProvider } from "./SiteViewProvider";

interface SitePageProps {
  view: SiteView;
}

/**
 * The public site rendered from a site view. No directive, so it renders on the server (the page)
 * and inside a client tree alike.
 */
export function SitePage({ view }: SitePageProps) {
  const { site, menu, images } = view;
  return (
    <SiteViewProvider view={view}>
      <ServicesProvider>
        <AppShell>
          <Deck>
            <h1 className="sr">Rave’s Parlor London – hair salon</h1>
            <HeroPair left={images.heroLeft} right={images.heroRight} />
            <SplitSlide image={images.split} />
            <ParlorSlide site={site} image={images.parlor} />
            <ReviewsSlide site={site} />
            <ServicesOverview menu={menu} images={images} />

            {/* Final slide: scrolls normally inside itself */}
            <div className="slide scroll rest" id="rest" data-tone="light">
              <ServiceMenu />
              <PriceList />
              <BookVisit site={site} />
              <SiteFooter site={site} />
            </div>
          </Deck>
        </AppShell>

        <ServiceDialog />
      </ServicesProvider>
    </SiteViewProvider>
  );
}
