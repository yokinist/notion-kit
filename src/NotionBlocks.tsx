import { RichText } from "./RichText.js";
import type { Context, NotionBlock, NotionBlocksOptions } from "./types.js";

const Block = ({ block, ctx }: { block: NotionBlock; ctx: Context }) => {
  switch (block.type) {
    case "paragraph":
      return (
        <p>
          <RichText text={block.paragraph.rich_text} ctx={ctx} />
        </p>
      );
    default:
      return null;
  }
};

const Blocks = ({ blocks, ctx }: { blocks: NotionBlock[]; ctx: Context }) =>
  blocks.map((block) => <Block key={block.id} block={block} ctx={ctx} />);

export type NotionBlocksProps = NotionBlocksOptions & { blocks: NotionBlock[] };

/** Renders Notion blocks (from fetchBlockTree) as HTML. */
export const NotionBlocks = ({
  blocks,
  pageUrl = () => undefined,
}: NotionBlocksProps) => <Blocks blocks={blocks} ctx={{ pageUrl }} />;
