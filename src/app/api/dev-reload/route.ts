import { watch, type FSWatcher } from "node:fs";
import path from "node:path";

/**
 * Dev-only live reload for the standalone HTML pages in `public/`.
 *
 * Next.js does not watch `public/`, so editing one of those pages normally
 * needs a manual browser refresh. This endpoint bridges that gap: it watches
 * `public/` and pushes a `reload` event over SSE to every connected page.
 *
 * It is inert outside development — both the status probe and the stream
 * return 404 in a production build.
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Client = { send: (payload: string) => void };

type DevReloadState = {
  clients: Set<Client>;
  watcher: FSWatcher | null;
  debounce: NodeJS.Timeout | null;
};

/** Kept on globalThis so it survives dev module re-evaluation. */
function getState(): DevReloadState {
  const g = globalThis as unknown as { __globalzwDevReload?: DevReloadState };
  if (!g.__globalzwDevReload) {
    g.__globalzwDevReload = { clients: new Set(), watcher: null, debounce: null };
  }
  return g.__globalzwDevReload;
}

function scheduleReload(state: DevReloadState) {
  // editors fire several events per save, so collapse them into one reload
  if (state.debounce) clearTimeout(state.debounce);
  state.debounce = setTimeout(() => {
    state.debounce = null;
    for (const client of state.clients) client.send("reload");
  }, 120);
}

function startWatcher(state: DevReloadState) {
  if (state.watcher) return;
  const dir = path.join(process.cwd(), "public");
  try {
    state.watcher = watch(dir, { persistent: false }, (_event, filename) => {
      const name = filename ? String(filename) : "";
      if (name && !/\.(html?|css|js|mjs|json|svg|png|jpe?g|webp|avif)$/i.test(name)) return;
      scheduleReload(state);
    });
    state.watcher.on("error", () => {
      state.watcher?.close();
      state.watcher = null;
    });
  } catch {
    // no public/ directory — live reload simply stays off
    state.watcher = null;
  }
}

export async function GET(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return new Response("Not found", { status: 404 });
  }

  const state = getState();

  // cheap probe the client uses to decide whether to open a stream at all
  if (new URL(request.url).searchParams.has("status")) {
    return new Response(null, { status: 204 });
  }

  startWatcher(state);

  const encoder = new TextEncoder();
  let client: Client | null = null;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const write = (payload: string) => {
        try {
          controller.enqueue(encoder.encode(payload));
        } catch {
          // client disconnected mid-write
        }
      };
      write(": connected\n\n");
      client = { send: (payload) => write(`data: ${payload}\n\n`) };
      state.clients.add(client);
    },
    cancel() {
      if (client) state.clients.delete(client);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
