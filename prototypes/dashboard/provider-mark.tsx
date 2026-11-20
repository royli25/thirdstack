import braveMark from "./assets/brave-mark.png";
import browserbaseMark from "./assets/browserbase-mark.svg";
import exaMark from "./assets/exa.svg";
import firecrawlMark from "./assets/firecrawl-transparent.png";
import jinaMark from "./assets/jina-mark.png";
import linkupMark from "./assets/linkup-mark.png";
import parallelMark from "./assets/parallel-mark.svg";
import perplexityMark from "./assets/perplexity-mark.svg";
import serperMark from "./assets/serper-mark.png";
import tavilyMark from "./assets/tavily.svg";

// New marks come from the providers' official site icons. Keep these local so
// opening the prototype does not make third-party requests.
export const providerMarks = {
  // https://brave.com/brave-branding-assets/
  brave: braveMark,
  // https://www.browserbase.com/favicon.svg
  browserbase: browserbaseMark,
  exa: exaMark,
  firecrawl: firecrawlMark,
  // https://jina.ai/icons/favicon-128x128.png
  jina: jinaMark,
  // https://www.linkup.so/
  linkup: linkupMark,
  // https://parallel.ai/
  parallel: parallelMark,
  // https://www.perplexity.ai/favicon.svg
  perplexity: perplexityMark,
  // https://serper.dev/apple-touch-icon.png
  serper: serperMark,
  tavily: tavilyMark,
};

export function ProviderMark({ logo }: { logo: string }) {
  return (
    <img
      className="demo-provider-mark"
      data-exa={logo === exaMark || undefined}
      src={logo}
      width={22}
      height={22}
      alt=""
    />
  );
}
