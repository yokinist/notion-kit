import { fetchBlockTree } from "@yokinist/notion-fetch";
import { NotionBlocks } from "@yokinist/notion-rsc";
import type { ReactNode } from "react";
import { data, Link } from "react-router";
import { getPosts, limit, notion } from "~/lib/notion";
import type { Route } from "./+types/post";

export async function loader({ params }: Route.LoaderArgs) {
  const posts = await getPosts();
  const post = posts.find((p) => p.slug === params.slug);
  if (!post) throw data(null, { status: 404 });

  const blocks = await fetchBlockTree(notion, post.id, { limit });
  // Links to other posts in Notion become links to their pages here
  const paths = Object.fromEntries(
    posts.map((p) => [p.id.replaceAll("-", ""), `/posts/${p.slug}`]),
  );
  return { post, blocks, paths };
}

export function meta({ loaderData }: Route.MetaArgs) {
  return [
    { title: `${loaderData?.post.title} | notion-kit blog` },
    { name: "description", content: loaderData?.post.summary },
  ];
}

const RouterLink = ({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) => <Link to={href}>{children}</Link>;

export function ServerComponent({ loaderData }: Route.ServerComponentProps) {
  const { post, blocks, paths } = loaderData;
  return (
    <article>
      <h1>{post.title}</h1>
      {post.date && <time dateTime={post.date}>{post.date}</time>}
      <NotionBlocks
        blocks={blocks}
        pageUrl={(id) => paths[id]}
        fileUrl={(id) => `/api/notion/file/${id}`}
        components={{ Link: RouterLink }}
      />
    </article>
  );
}
