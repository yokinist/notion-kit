import { fetchBlockTree } from "@yokinist/notion-fetch";
import { NotionBlocks } from "@yokinist/notion-rsc";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPosts, limit, notion } from "@/lib/notion";

export const revalidate = 60;

export async function generateStaticParams() {
  const posts = await getPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/posts/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const post = (await getPosts()).find((p) => p.slug === slug);
  return post ? { title: post.title, description: post.summary } : {};
}

export default async function PostPage({ params }: PageProps<"/posts/[slug]">) {
  const { slug } = await params;
  const posts = await getPosts();
  const post = posts.find((p) => p.slug === slug);
  if (!post) notFound();

  const blocks = await fetchBlockTree(notion, post.id, { limit });
  // Links to other posts in Notion become links to their pages here
  const paths = new Map(
    posts.map((p) => [p.id.replaceAll("-", ""), `/posts/${p.slug}`]),
  );

  return (
    <article>
      <h1>{post.title}</h1>
      {post.date && <time dateTime={post.date}>{post.date}</time>}
      <NotionBlocks
        blocks={blocks}
        pageUrl={(id) => paths.get(id)}
        fileUrl={(id) => `/api/notion/file/${id}`}
        fetchInit={{ next: { revalidate: 86400 } }}
        components={{ Link }}
      />
    </article>
  );
}
