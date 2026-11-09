import type { ReactNode } from "react";
import { DeckProvider } from "@/components/deck/DeckProvider";
import { MenuProvider } from "./MenuProvider";
import { NavMenu } from "./NavMenu";
import { SiteHeader } from "./SiteHeader";

interface AppShellProps {
  children: ReactNode;
}

/** The header, the menu and the deck share one menu state and one deck controller. */
export function AppShell({ children }: AppShellProps) {
  return (
    <MenuProvider>
      <DeckProvider>
        <SiteHeader />
        <NavMenu />
        {children}
      </DeckProvider>
    </MenuProvider>
  );
}
