import { SitePage } from "@/components/site/SitePage";
import { DEFAULT_CONTENT } from "@/lib/content/defaults";
import { buildSiteView } from "@/lib/content/view";

export default function Home() {
  return <SitePage view={buildSiteView(DEFAULT_CONTENT, "")} />;
}
