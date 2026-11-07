import { BookVisit } from "@/components/BookVisit";
import { HeroPair } from "@/components/HeroPair";
import { NavMenu } from "@/components/NavMenu";
import { ParlorSlide } from "@/components/ParlorSlide";
import { PriceList } from "@/components/PriceList";
import { ServiceMenu } from "@/components/ServiceMenu";
import { ServiceModal } from "@/components/ServiceModal";
import { ServicesOverview } from "@/components/ServicesOverview";
import { SiteBehavior } from "@/components/SiteBehavior";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { SplitSlide } from "@/components/SplitSlide";

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
