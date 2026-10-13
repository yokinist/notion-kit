import katex from "katex";
import { cx } from "./cx.js";

/** TeX rendered by KaTeX. Its stylesheet comes with styles.css. */
export const Equation = ({
  expression,
  block = false,
  className,
}: {
  expression: string;
  block?: boolean;
  className?: string;
}) => {
  const Tag = block ? "div" : "span";
  return (
    <Tag
      className={cx(block && "notion-equation", className)}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: KaTeX output of the author's equation
      dangerouslySetInnerHTML={{
        __html: katex.renderToString(expression, {
          displayMode: block,
          throwOnError: false,
        }),
      }}
    />
  );
};
