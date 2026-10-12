import type { ReactNode } from "react";
import { prerender } from "react-dom/static";

/** Server-renders (async components included) into a DOM to query. */
export const renderToDom = async (node: ReactNode) => {
  const { prelude } = await prerender(node);
  const container = document.createElement("div");
  container.innerHTML = await new Response(prelude).text();
  return container;
};
