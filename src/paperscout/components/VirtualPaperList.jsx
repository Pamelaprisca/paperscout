import { useState } from "react";

import { PaperCard } from "./PaperCard.jsx";

const ITEM_HEIGHT = 236;
const OVERSCAN = 2;

export function VirtualPaperList({
  papers,
  height = 720,
  itemHeight = ITEM_HEIGHT,
}) {
  const [scrollTop, setScrollTop] = useState(0);
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - OVERSCAN);
  const endIndex = Math.min(
    papers.length,
    Math.ceil((scrollTop + height) / itemHeight) + OVERSCAN,
  );
  const visiblePapers = papers.slice(startIndex, endIndex);

  return (
    <div
      className="overflow-y-auto rounded-lg"
      style={{ height }}
      onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
    >
      <div
        className="relative"
        style={{ height: papers.length * itemHeight }}
      >
        {visiblePapers.map((paper, index) => {
          const absoluteIndex = startIndex + index;

          return (
            <div
              key={paper.id}
              className="absolute left-0 right-0 px-0.5 pb-3"
              style={{
                height: itemHeight,
                transform: `translateY(${absoluteIndex * itemHeight}px)`,
              }}
            >
              <PaperCard paper={paper} compact />
            </div>
          );
        })}
      </div>
    </div>
  );
}
