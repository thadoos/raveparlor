import { BookVisit } from "@/components/sections/BookVisit";
import { HeroPair } from "@/components/slides/HeroPair";
import { NavMenu } from "@/components/layout/NavMenu";
import { ParlorSlide } from "@/components/slides/ParlorSlide";
import { PriceList } from "@/components/sections/PriceList";
import { ServiceMenu } from "@/components/services/ServiceMenu";
import { ServiceModal } from "@/components/services/ServiceModal";
import { ServicesOverview } from "@/components/services/ServicesOverview";
import { SiteBehavior } from "@/components/SiteBehavior";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SplitSlide } from "@/components/slides/SplitSlide";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <NavMenu />

      <main className="deck" id="deck">
        <h1 className="sr">Rave’s Parlor London – hair salon</h1>
        <HeroPair />
        <SplitSlide />
        <ParlorSlide />
        <ServicesOverview />

        {/* Final slide: scrolls normally inside itself */}
        <div className="slide scroll rest" id="rest" data-tone="light">
          <ServiceMenu />
          <PriceList />
          <BookVisit />
          <SiteFooter />
        </div>
      </main>

      <ServiceModal />
      <SiteBehavior />
    </>
  );
}
