import katex from "katex";

/** TeX rendered by KaTeX. Its stylesheet comes with styles.css. */
export const Equation = ({
  expression,
  block = false,
}: {
  expression: string;
  block?: boolean;
}) => {
  const Tag = block ? "div" : "span";
  return (
    <Tag
      className={block ? "notion-equation" : undefined}
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
