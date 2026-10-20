import {
  createBundledHighlighter,
  createSingletonShorthands,
} from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import { bundledLanguages } from "shiki/langs";
import { bundledThemes } from "shiki/themes";
import { cx } from "./cx.js";

// Notion language names that Shiki spells differently
const LANGUAGES: Record<string, string> = {
  "plain text": "text",
  shell: "bash",
  "c++": "cpp",
  "c#": "csharp",
  "java/c/c++/c#": "java",
};

// The JavaScript regex engine, not Shiki's default WASM one: Cloudflare
// Workers refuse to compile WASM at runtime. With ES2018 regexes it colors
// like the WASM engine (newer targets miss SQL keywords, among others), and
// forgiving skips the few patterns it cannot translate instead of throwing.
const { codeToHtml } = createSingletonShorthands(
  createBundledHighlighter({
    langs: bundledLanguages,
    themes: bundledThemes,
    engine: () =>
      createJavaScriptRegexEngine({ target: "ES2018", forgiving: true }),
  }),
);

const highlight = async (code: string, language: string) => {
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
 * A code block, highlighted at render time by Shiki so no highlighter ships
 * to the browser.
 */
export const Code = async ({
  code,
  language,
  className,
}: {
  code: string;
  language: string;
  className?: string;
}) => {
  const html = await highlight(code, language);
  return (
    <div
      className={cx("notion-code not-prose", className)}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: Shiki escapes the code
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};
