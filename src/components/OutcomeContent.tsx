import { memo } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "./ui/table";
/** Source text is preserved separately. No raw HTML, remote images, or executable links. */
export const OutcomeContent = memo(function OutcomeContent({
  text,
}: {
  text: string;
}) {
  return (
    <div className="output-text rendered-output" tabIndex={0}>
      <Markdown
        remarkPlugins={[remarkGfm]}
        components={{
          pre: ({ children }) => <pre tabIndex={0}>{children}</pre>,
          table: ({ children }) => <Table>{children}</Table>,
          thead: ({ children }) => <TableHeader>{children}</TableHeader>,
          tbody: ({ children }) => <TableBody>{children}</TableBody>,
          tr: ({ children }) => <TableRow>{children}</TableRow>,
          th: ({ children }) => <TableHead>{children}</TableHead>,
          td: ({ children }) => <TableCell>{children}</TableCell>,
          a: ({ href, children }) => {
            let safe = false;
            try {
              const url = new URL(href || "");
              safe =
                ["http:", "https:"].includes(url.protocol) &&
                !url.username &&
                !url.password;
            } catch {}
            return safe ? (
              <a href={href} target="_blank" rel="noopener noreferrer">
                {children}
              </a>
            ) : (
              <span>{children}</span>
            );
          },
          img: ({ alt }) => (
            <span className="omitted-image">
              [Image omitted{alt ? `: ${alt}` : ""}]
            </span>
          ),
          h1: ({ children }) => <h3>{children}</h3>,
          h2: ({ children }) => <h3>{children}</h3>,
          h3: ({ children }) => <h3>{children}</h3>,
          h4: ({ children }) => <h3>{children}</h3>,
          h5: ({ children }) => <h3>{children}</h3>,
          h6: ({ children }) => <h3>{children}</h3>,
        }}
      >
        {text}
      </Markdown>
    </div>
  );
});
