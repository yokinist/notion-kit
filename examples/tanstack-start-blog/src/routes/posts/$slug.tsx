import { createFileRoute, notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { renderServerComponent } from "@tanstack/react-start/rsc";
import { fetchBlockTree } from "@yokinist/notion-fetch";
import { NotionBlocks } from "@yokinist/notion-rsc";
import { getPosts, limit, notion } from "#/lib/notion";

// Renders the post on the server; the browser gets the result, not the
// renderer
const getPost = createServerFn()
  .validator((slug: string) => slug)
  .handler(async ({ data: slug }) => {
    const posts = await getPosts();
    const post = posts.find((p) => p.slug === slug);
    if (!post) throw notFound();

    const blocks = await fetchBlockTree(notion, post.id, { limit });
    // Links to other posts in Notion become links to their pages here
    const paths = new Map(
      posts.map((p) => [p.id.replaceAll("-", ""), `/posts/${p.slug}`]),
    );
    const Content = await renderServerComponent(
      <NotionBlocks
        blocks={blocks}
        pageUrl={(id) => paths.get(id)}
        fileUrl={(id) => `/api/notion/file/${id}`}
      />,
    );
    return { post, Content };
  });

export const Route = createFileRoute("/posts/$slug")({
  loader: ({ params }) => getPost({ data: params.slug }),
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.post.title} | notion-kit blog` },
      { name: "description", content: loaderData?.post.summary },
    ],
  }),
  component: PostPage,
});

function PostPage() {
  const { post, Content } = Route.useLoaderData();
  return (
    <article>
      <h1>{post.title}</h1>
      {post.date && <time dateTime={post.date}>{post.date}</time>}
      {Content}
    </article>
  );
}
