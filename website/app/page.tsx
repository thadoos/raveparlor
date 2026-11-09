import { AppShell } from "@/components/layout/AppShell";
import { BookVisit } from "@/components/sections/BookVisit";
import { Deck } from "@/components/deck/Deck";
import { HeroPair } from "@/components/slides/HeroPair";
import { ParlorSlide } from "@/components/slides/ParlorSlide";
import { PriceList } from "@/components/sections/PriceList";
import { ServiceMenu } from "@/components/services/ServiceMenu";
import { ServiceDialog } from "@/components/services/ServiceDialog";
import { ServicesOverview } from "@/components/services/ServicesOverview";
import { ServicesProvider } from "@/components/services/ServicesProvider";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SplitSlide } from "@/components/slides/SplitSlide";

export default function Home() {
  return (
    <ServicesProvider>
      <AppShell>
        <Deck>
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
        </Deck>
      </AppShell>

      <ServiceDialog />
    </ServicesProvider>
  );
}
