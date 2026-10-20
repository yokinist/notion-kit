import { Link } from "react-router";
import { getPosts } from "~/lib/notion";
import type { Route } from "./+types/home";

export async function loader() {
  return { posts: await getPosts() };
}

export function meta() {
  return [{ title: "notion-kit blog" }];
}

export function ServerComponent({ loaderData }: Route.ServerComponentProps) {
  return (
    <ul className="posts">
      {loaderData.posts.map((post) => (
        <li key={post.id}>
          {post.date && <time dateTime={post.date}>{post.date}</time>}
          <h2>
            <Link to={`/posts/${post.slug}`}>{post.title}</Link>
          </h2>
          {post.summary && <p>{post.summary}</p>}
        </li>
      ))}
    </ul>
  );
}
