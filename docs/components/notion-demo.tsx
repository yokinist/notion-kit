import { NotionBlocks } from "@yokinist/notion-rsc";
import { demoBlocks } from "@/lib/demo-blocks";

export function NotionDemo() {
  return (
    <div className="not-fumadocs-codeblock rounded-xl border bg-fd-card px-6 py-2">
      <NotionBlocks
        blocks={demoBlocks}
        fetchInit={{ next: { revalidate: 86400 } }}
      />
    </div>
  );
}
