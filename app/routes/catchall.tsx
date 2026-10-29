import type { LoaderFunctionArgs } from "react-router";
import { NotFoundView } from "../frontend/view/NotFoundView";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const pathname = url.pathname.toLowerCase();

  if (
    pathname.endsWith(".jpg") ||
    pathname.endsWith(".jpeg") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".webp") ||
    pathname.endsWith(".svg") ||
    pathname.endsWith(".ico") ||
    pathname.endsWith(".gif")
  ) {
    return new Response("Asset not found", {
      status: 404,
      headers: {
        "Content-Type": "text/plain",
        "Cache-Control": "no-cache",
      },
    });
  }

  return new Response(null, {
    status: 404,
    statusText: "Not Found",
  });
}

export default function CatchAll() {
  return <NotFoundView />;
}
