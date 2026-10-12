// Minimal Notion API objects for tests
export const text = (content: string, overrides: object = {}) => ({
  type: "text",
  plain_text: content,
  href: null,
  annotations: {
    bold: false,
    italic: false,
    strikethrough: false,
    underline: false,
    code: false,
    color: "default",
  },
  ...overrides,
});

export const block = (type: string, value: object, extra: object = {}) =>
  ({
    object: "block",
    id: `${type}-id`,
    type,
    has_children: false,
    [type]: value,
    ...extra,
  }) as never;
