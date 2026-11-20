import { useEffect, useRef, useState } from "react";
import { PauseCircle, PlayCircle } from "@untitledui/icons";
import { Button } from "@/components/ui/button";
import "./glyph-field.css";

const rows = Array.from({ length: 24 }, (_, y) =>
  Array.from({ length: 230 }, (_, x) => {
    const wave = Math.sin(x * 0.085 + y * 0.27) + Math.cos(x * 0.19 - y * 0.23);
    const noise = (Math.sin(x * 43.1 + y * 183.7) + 1) * 0.5;
    return wave > 0.85 + noise
      ? "@"
      : wave > 0.45
        ? "+"
        : noise > 0.13
          ? "/"
          : "·";
  }).join(" "),
);

export function GlyphField() {
  const field = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      setVisible(entry.isIntersecting);
    });
    if (field.current) observer.observe(field.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className="th-glyph-field"
      ref={field}
      data-running={visible && !paused}
    >
      <pre aria-hidden="true">
        {rows.map((row, index) => (
          <span key={index} style={{ animationDelay: `${index * -0.35}s` }}>
            {row}
            {"\n"}
          </span>
        ))}
      </pre>
      <Button
        className="th-glyph-toggle"
        variant="ghost"
        size="icon-sm"
        aria-label={
          paused ? "Play background animation" : "Pause background animation"
        }
        onClick={() => setPaused(!paused)}
      >
        {paused ? <PlayCircle /> : <PauseCircle />}
      </Button>
    </div>
  );
}
