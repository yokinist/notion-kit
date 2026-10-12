import "@yokinist/notion-rsc/styles.css";
import "./styles.css";
import {
  isRouteErrorResponse,
  Link,
  Links,
  Meta,
  Outlet,
  ScrollRestoration,
} from "react-router";
import type { Route } from "./+types/root";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <header>
          <Link to="/">notion-kit blog</Link>
        </header>
        <main>{children}</main>
        <footer>
          Written in Notion, rendered with{" "}
          <a href="https://github.com/yokinist/notion-kit">notion-kit</a>.
        </footer>
        <ScrollRestoration />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const notFound = isRouteErrorResponse(error) && error.status === 404;
  return <h1>{notFound ? "Not found" : "Something went wrong"}</h1>;
}
