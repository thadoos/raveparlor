import { SitePage } from "@/components/site/SitePage";
import { getSiteView } from "@/lib/content/published";

export default async function Home() {
  return <SitePage view={await getSiteView()} />;
}
