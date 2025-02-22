import React from "react";
import { Box } from "theme-ui";

interface GridProps<T> {
  elems: readonly (T | undefined)[];
  renderElem: (elem: T, index: number) => JSX.Element | null;
  defineElementKey: (elem: T) => string;
  gridTemplateMinPx?: string;
}

function Grid<T>({
  elems,
  gridTemplateMinPx = "320px",
  renderElem,
  defineElementKey,
}: GridProps<T>): JSX.Element {
  return (
    <Box
      as="section"
      sx={{
        display: "grid",
        gridTemplateColumns: `repeat(auto-fill, minmax(${gridTemplateMinPx}, 1fr))`,
        gridGap: "16px",
        pt: 2,
        mb: 3,
      }}
    >
      {elems.map((elem: T | undefined, i: number) =>
        elem ? (
          <span key={`${defineElementKey(elem)}-${i + 1}`}>
            {renderElem(elem, i)}
          </span>
        ) : null
      )}
    </Box>
  );
}

export default Grid;
