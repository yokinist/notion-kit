/**
 * TeX rendered by KaTeX (an optional peer dependency); without it, the
 * source is shown. Include katex/dist/katex.min.css on the page.
 */
export const Equation = async ({
  expression,
  block = false,
}: {
  expression: string;
  block?: boolean;
}) => {
  const katex = await import("katex")
    .then((m) => m.default)
    .catch(() => undefined);
  const Tag = block ? "div" : "span";
  if (!katex) {
    return (
      <Tag className={block ? "notion-equation" : undefined}>
        <code>{expression}</code>
      </Tag>
    );
  }
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
