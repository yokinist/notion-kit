// Notion language names that Shiki spells differently
const LANGUAGES: Record<string, string> = {
  "plain text": "text",
  shell: "bash",
  "c++": "cpp",
  "c#": "csharp",
  "java/c/c++/c#": "java",
};

const highlight = async (code: string, language: string) => {
  const { codeToHtml } = await import("shiki");
  const options = {
    themes: { light: "github-light", dark: "github-dark" },
    defaultColor: false,
  } as const;
  return codeToHtml(code, {
    lang: LANGUAGES[language] ?? language,
    ...options,
  }).catch(() => codeToHtml(code, { lang: "text", ...options }));
};

/**
 * A code block, highlighted at render time by Shiki (an optional peer
 * dependency) so no highlighter ships to the browser.
 */
export const Code = async ({
  code,
  language,
}: {
  code: string;
  language: string;
}) => {
  const html = await highlight(code, language).catch(() => undefined);
  if (html === undefined) {
    // Same structure as Shiki's output, so one stylesheet fits both
    return (
      <div className="notion-code">
        <pre>
          <code>{code}</code>
        </pre>
      </div>
    );
  }
  return (
    <div
      className="notion-code"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: Shiki escapes the code
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};
