import Link from "next/link";
import { getPosts } from "@/lib/notion";

// Pick up changes in Notion at most a minute later
export const revalidate = 60;

export default async function Home() {
  const posts = await getPosts();
  return (
    <ul className="posts">
      {posts.map((post) => (
        <li key={post.id}>
          {post.date && <time dateTime={post.date}>{post.date}</time>}
          <h2>
            <Link href={`/posts/${post.slug}`}>{post.title}</Link>
          </h2>
          {post.summary && <p>{post.summary}</p>}
        </li>
      ))}
    </ul>
  );
}
