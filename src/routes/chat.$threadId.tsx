import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { Menu, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useSpeech } from "@/hooks/use-speech";
import { DEFAULT_PROFILE_ID } from "@/lib/voice";
import {
  createThread,
  deleteThread,
  listThreads,
  loadMessages,
  loadSettings,
  saveSettings,
  type Thread,
} from "@/lib/threads";
import { Sidebar } from "@/components/ultron/Sidebar";
import neonLogo from "@/assets/Neon Cyberpunk Robot Head Bust.png";
import { SignalLevel } from "@/components/ultron/SignalLevel";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";

export const Route = createFileRoute("/chat/$threadId")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Ultron AI — console" },
      {
        name: "description",
        content: "Talk with Ultron AI, hear replies in your chosen voice and keep every session.",
      },
      { property: "og:title", content: "Ultron AI — console" },
      {
        property: "og:description",
        content: "Talk with Ultron AI, hear replies in your chosen voice and keep every session.",
      },
    ],
  }),
  component: ChatPage,
});

const SUGGESTIONS = [
  "Explain how recursion works",
  "Help me debug a JavaScript error",
  "Give me five project ideas",
  "Teach me something new in 2 minutes",
];

function textOf(message: UIMessage) {
  return message.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");
}

function friendlierError(raw?: string | null): string {
  const text = (raw ?? "").trim();
  if (!text) return "Ultron could not answer.";
  let message = text;
  try {
    const parsed = JSON.parse(text) as { error?: string };
    if (parsed.error) message = parsed.error;
  } catch {
    // not JSON — keep the text as it arrived
  }
  if (message.includes("AI is not configured")) {
    return "AI replies aren't set up on this computer yet. Add OPENAI_API_KEY to the .env file and restart the app.";
  }
  return message;
}

function ChatPage() {
  const { threadId } = Route.useParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) void navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  const [threads, setThreads] = useState<Thread[]>([]);
  const [profileId, setProfileId] = useState(DEFAULT_PROFILE_ID);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [ready, setReady] = useState(false);
  const [initial, setInitial] = useState<UIMessage[] | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const speech = useSpeech(profileId);
  const speechRef = useRef(speech);
  speechRef.current = speech;

  const refreshThreads = useCallback(async () => {
    try {
      setThreads(await listThreads());
    } catch (error) {
      console.error(error);
    }
  }, []);

  // settings
  useEffect(() => {
    if (!user) return;
    loadSettings(user.id)
      .then((s) => {
        setProfileId(s.voice_profile);
        setTheme(s.theme === "light" ? "light" : "dark");
        speechRef.current.setMuted(s.muted);
        setReady(true);
      })
      .catch(() => setReady(true));
  }, [user]);

  useEffect(() => {
    document.documentElement.classList.toggle("light", theme === "light");
  }, [theme]);

  // thread + messages
  useEffect(() => {
    if (!user) return;
    setInitial(null);
    speechRef.current.stop();
    void refreshThreads();
    loadMessages(threadId)
      .then(setInitial)
      .catch((error) => {
        toast.error(error instanceof Error ? error.message : "Could not load session.");
        setInitial([]);
      });
  }, [user, threadId, refreshThreads]);

  const persist = useCallback(
    (patch: Parameters<typeof saveSettings>[1]) => {
      if (user) saveSettings(user.id, patch).catch(console.error);
    },
    [user],
  );

  const handleNew = async () => {
    if (!user) return;
    try {
      const t = await createThread(user.id);
      setSidebarOpen(false);
      void navigate({ to: "/chat/$threadId", params: { threadId: t.id } });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create session.");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteThread(id);
      const rest = (await listThreads()).filter((t) => t.id !== id);
      setThreads(rest);
      if (id === threadId) {
        if (rest[0]) void navigate({ to: "/chat/$threadId", params: { threadId: rest[0].id } });
        else void handleNew();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete session.");
    }
  };

  const signOut = async () => {
    speech.stop();
    await supabase.auth.signOut();
    void navigate({ to: "/auth" });
  };

  const sidebar = (
    <Sidebar
      threads={threads}
      activeId={threadId}
      onNewSession={handleNew}
      onDelete={handleDelete}
      profileId={profileId}
      onSelectProfile={(id) => {
        setProfileId(id);
        persist({ voice_profile: id });
      }}
      onPreviewVoice={() =>
        speech.speak("Ultron core online. This is how I sound, operator.", { force: true })
      }
      speechSupported={speech.supported}
      theme={theme}
      onToggleTheme={() => {
        const next = theme === "dark" ? "light" : "dark";
        setTheme(next);
        persist({ theme: next });
      }}
      onSignOut={signOut}
      email={user?.email ?? ""}
      open={sidebarOpen}
      onClose={() => setSidebarOpen(false)}
    />
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background text-ink">
      {sidebar}
      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-line bg-background/80 px-4 py-3 backdrop-blur-md">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              aria-label="Open sessions"
              onClick={() => setSidebarOpen(true)}
              className="shrink-0 text-dim transition-colors hover:text-ink md:hidden"
            >
              <Menu className="size-5" />
            </button>
            <div className="min-w-0">
              <div className="truncate font-mono text-[14px] font-semibold tracking-[0.18em] text-ink">
                ULTRON&nbsp;OMEGA
              </div>
              <div className="mt-0.5 truncate font-mono text-[11px] font-medium tracking-[0.14em] text-dim brightness-150">
                {speech.speaking ? (speech.paused ? "paused" : "speaking") : "online"}
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <SignalLevel active={speech.speaking && !speech.paused} />
            <button
              type="button"
              onClick={speech.toggleMute}
              onClickCapture={() => persist({ muted: !speech.muted })}
              className="flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 font-mono text-[11px] font-semibold tracking-[0.08em] text-ink transition-colors hover:border-signal/50"
            >
              {speech.muted ? <VolumeX className="size-3.5" /> : <Volume2 className="size-3.5" />}
              {speech.muted ? "UNMUTE" : "MUTE"}
            </button>
            <button
              type="button"
              onClick={speech.pause}
              disabled={!speech.speaking || speech.paused}
              className="hidden items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 font-mono text-[11px] font-semibold tracking-[0.08em] text-ink transition-colors hover:border-signal/50 disabled:opacity-40 sm:flex"
            >
              <Pause className="size-3.5" />
              PAUSE
            </button>
            <button
              type="button"
              onClick={speech.resume}
              disabled={!speech.paused}
              className="hidden items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 font-mono text-[11px] font-semibold tracking-[0.08em] text-ink transition-colors hover:border-voice/50 disabled:opacity-40 sm:flex"
            >
              <Play className="size-3.5" />
              RESUME
            </button>
          </div>
        </header>

        {initial && ready ? (
          <ChatBody
            key={threadId}
            threadId={threadId}
            initial={initial}
            speak={(t) => speechRef.current.speak(t)}
            onStarted={refreshThreads}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <span className="font-mono text-[11px] tracking-[0.28em] text-dim">LOADING…</span>
          </div>
        )}
      </main>
    </div>
  );
}

function ChatBody({
  threadId,
  initial,
  speak,
  onStarted,
}: {
  threadId: string;
  initial: UIMessage[];
  speak: (text: string) => void;
  onStarted: () => void;
}) {
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        headers: async () => {
          const { data } = await supabase.auth.getSession();
          return { Authorization: `Bearer ${data.session?.access_token ?? ""}` };
        },
        body: { threadId },
      }),
    [threadId],
  );

  const { messages, sendMessage, status, stop, error } = useChat({
    id: threadId,
    messages: initial,
    transport,
    onFinish: ({ message }) => {
      const text = textOf(message);
      if (text) speak(text);
      onStarted();
    },
  });

  const busy = status === "submitted" || status === "streaming";

  const send = (text: string) => {
    const clean = text.trim();
    if (!clean || busy) return;
    void sendMessage({ text: clean });
    setTimeout(onStarted, 800);
  };

  return (
    <>
      <Conversation className="flex-1">
        <ConversationContent className="mx-auto w-full max-w-3xl px-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
              <img
                src={neonLogo}
                alt="Ultron core"
                className="logo-glow-lg h-24 w-auto object-contain"
              />
              <div className="font-mono text-[12px] tracking-[0.32em] text-dim">
                ULTRON CORE READY
              </div>
              <p className="max-w-sm text-sm leading-relaxed text-dim">
                Ask a question, explain a concept, debug code or brainstorm. Replies are spoken in
                your chosen voice.
              </p>
              <div className="mt-2 flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    className="rounded-full border border-line/70 bg-panel/60 px-4 py-1.5 text-xs text-dim transition-all hover:border-voice/40 hover:text-ink"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m) => (
              <Message
                key={m.id}
                from={m.role === "user" ? "user" : "assistant"}
                className="animate-rise"
              >
                {m.role === "assistant" && (
                  <div className="mb-1.5 flex items-center gap-2">
                    <img
                      src={neonLogo}
                      alt=""
                      className="logo-glow h-6 w-auto shrink-0 object-contain"
                    />
                    <span className="font-mono text-[10px] tracking-[0.24em] text-voice">
                      ULTRON
                    </span>
                  </div>
                )}
                <MessageContent
                  className={
                    m.role === "user"
                      ? "rounded-2xl rounded-br-md border border-signal/25 bg-gradient-to-br from-signal/20 to-voice/15 px-4 py-3 text-ink"
                      : "rounded-2xl rounded-tl-md border border-line/60 bg-panel/70 px-4 py-3"
                  }
                >
                  {m.role === "user" ? textOf(m) : <MessageResponse>{textOf(m)}</MessageResponse>}
                </MessageContent>
              </Message>
            ))
          )}
          {status === "submitted" && (
            <Message from="assistant">
              <div className="mb-1.5 flex items-center gap-2">
                <img
                  src={neonLogo}
                  alt=""
                  className="logo-glow h-6 w-auto shrink-0 animate-corepulse object-contain"
                />
                <span className="font-mono text-[10px] tracking-[0.24em] text-voice">ULTRON</span>
              </div>
              <MessageContent className="rounded-2xl rounded-tl-md border border-line/60 bg-panel/70 px-4 py-3">
                <Shimmer>Ultron is thinking…</Shimmer>
              </MessageContent>
            </Message>
          )}
          {error && (
            <Message from="assistant">
              <MessageContent>
                <span className="text-danger">{friendlierError(error.message)}</span>
              </MessageContent>
            </Message>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="mx-auto w-full max-w-3xl px-4 pb-4">
        <div className="overflow-hidden rounded-xl border border-voice/30 bg-surface/90 shadow-[0_0_32px_-10px_var(--color-voice)] backdrop-blur-md focus-within:border-voice/60">
          <PromptInput onSubmit={({ text }) => send(text)} className="border-0 bg-transparent shadow-none">
            <PromptInputBody>
              <PromptInputTextarea
                placeholder="Message Ultron…"
                className="border-0 bg-transparent px-4 pt-3.5 text-[15px] placeholder:text-dim/70 focus-visible:outline-none"
              />
            </PromptInputBody>
            <PromptInputFooter className="border-0 bg-transparent px-4 pb-3.5">
              <div className="font-mono text-[10px] tracking-[0.2em] text-dim">
                {busy ? "ULTRON IS RESPONDING…" : "ENTER TO SEND"}
              </div>
              <PromptInputSubmit status={status} onStop={stop} />
            </PromptInputFooter>
          </PromptInput>
        </div>
      </div>
    </>
  );
}
