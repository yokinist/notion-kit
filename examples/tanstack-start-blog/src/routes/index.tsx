import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getPosts } from "#/lib/notion";

// Loaders also run in the browser on navigation, so Notion is called
// through a server function
const listPosts = createServerFn().handler(() => getPosts());

export const Route = createFileRoute("/")({
  loader: () => listPosts(),
  component: Home,
});

function Home() {
  const posts = Route.useLoaderData();
  return (
    <ul className="posts">
      {posts.map((post) => (
        <li key={post.id}>
          {post.date && <time dateTime={post.date}>{post.date}</time>}
          <h2>
            <Link to="/posts/$slug" params={{ slug: post.slug }}>
              {post.title}
            </Link>
          </h2>
          {post.summary && <p>{post.summary}</p>}
        </li>
      ))}
    </ul>
  );
}
