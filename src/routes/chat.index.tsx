import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { createThread, listThreads } from "@/lib/threads";

export const Route = createFileRoute("/chat/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Ultron AI — command core" },
      {
        name: "description",
        content: "Open your Ultron AI sessions and keep talking with your assistant.",
      },
      { property: "og:title", content: "Ultron AI — command core" },
      {
        property: "og:description",
        content: "Open your Ultron AI sessions and keep talking with your assistant.",
      },
    ],
  }),
  component: ChatEntry,
});

function ChatEntry() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const started = useRef(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      void navigate({ to: "/auth" });
      return;
    }
    if (started.current) return;
    started.current = true;

    (async () => {
      try {
        const threads = await listThreads();
        const target = threads[0] ?? (await createThread(user.id));
        void navigate({ to: "/chat/$threadId", params: { threadId: target.id }, replace: true });
      } catch (error) {
        started.current = false;
        toast.error(error instanceof Error ? error.message : "Could not open your sessions.");
      }
    })();
  }, [loading, user, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex items-center gap-3">
        <span className="size-2.5 animate-corepulse rounded-full bg-signal" />
        <span className="font-mono text-[11px] tracking-[0.28em] text-dim">BOOTING CORE…</span>
      </div>
    </div>
  );
}
