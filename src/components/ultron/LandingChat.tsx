import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Check, Code2, Copy, GraduationCap, Lightbulb, Sparkles } from "lucide-react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useAuth } from "@/hooks/use-auth";
import logo from "@/assets/Neon Cyberpunk Robot Head Bust.png";
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

const CARDS = [
  {
    icon: Code2,
    title: "Debug my code",
    desc: "Paste an error, get a fix",
    prompt: "Help me debug a JavaScript error: explain the usual causes and how to fix them",
  },
  {
    icon: Lightbulb,
    title: "Brainstorm ideas",
    desc: "Five fresh project ideas",
    prompt: "Give me five project ideas with short descriptions",
  },
  {
    icon: GraduationCap,
    title: "Teach me something",
    desc: "A concept in 2 minutes",
    prompt: "Teach me something new in 2 minutes",
  },
  {
    icon: Sparkles,
    title: "Explain recursion",
    desc: "With a simple example",
    prompt: "Explain how recursion works with a simple example",
  },
];

function textOf(message: UIMessage): string {
  return message.parts
    .filter((part): part is { type: "text"; text: string } => part.type === "text")
    .map((part) => part.text)
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

/**
 * Landing page chat: works without an account (guest mode).
 * The API treats guest:true requests as stateless — nothing is saved.
 */
export function LandingChat() {
  const { session, loading } = useAuth();

  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/chat", body: { guest: true } }),
    [],
  );

  const { messages, sendMessage, status, stop, error, setMessages } = useChat({
    id: "guest-landing",
    transport,
  });

  const busy = status === "submitted" || status === "streaming";
  const started = messages.length > 0;

  const send = (text: string) => {
    const clean = text.trim();
    if (!clean || busy) return;
    void sendMessage({ text: clean });
  };

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyText = (id: string, text: string) => {
    void navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      window.setTimeout(() => setCopiedId((current) => (current === id ? null : current)), 1600);
    });
  };

  const prompt = (
    <div className="overflow-hidden rounded-xl border border-voice/40 bg-surface/90 shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-voice)_25%,transparent),0_0_40px_-8px_color-mix(in_oklab,var(--color-voice)_45%,transparent)] backdrop-blur-md focus-within:border-voice/70">
      <PromptInput onSubmit={({ text }) => send(text)} className="border-0 bg-transparent shadow-none">
        <PromptInputBody>
          <PromptInputTextarea
            placeholder="Message Ultron…"
            className="min-h-[76px] border-0 bg-transparent px-5 pt-4 text-[15px] text-ink placeholder:text-dim/80 focus-visible:outline-none"
          />
        </PromptInputBody>
        <PromptInputFooter className="border-0 bg-transparent px-5 pb-4">
          <div className="font-mono text-[10px] tracking-[0.22em] text-dim">
            NO ACCOUNT NEEDED · CHATS AREN'T SAVED
          </div>
          <PromptInputSubmit status={status} onStop={stop} />
        </PromptInputFooter>
      </PromptInput>
    </div>
  );

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-background text-ink">
      <div aria-hidden className="hud-grid pointer-events-none absolute inset-0" />
      <div
        aria-hidden
        className="hero-glow pointer-events-none absolute inset-x-0 top-0 h-[60vh]"
      />
      <header className="relative z-10 flex items-center justify-between gap-3 border-b border-line/70 bg-background/80 px-5 py-3 backdrop-blur-md">
        <div className="flex min-w-0 items-center gap-3">
          <span className="size-2.5 shrink-0 animate-corepulse rounded-full bg-signal" />
          <img
            src={logo}
            alt="Ultron neon head"
            className="logo-glow h-10 w-auto shrink-0 object-contain"
          />
          <div className="min-w-0">
            <div className="truncate font-mono text-[14px] font-semibold tracking-[0.18em] text-ink">
              ULTRON CORE
            </div>
            <div className="truncate font-mono text-[11px] font-medium tracking-[0.14em] text-dim brightness-150">
              CREATED BY MR. CHRIS
            </div>
          </div>
          {!loading && !session && (
            <span className="ml-1 shrink-0 rounded-md border border-voice/40 bg-voice/10 px-2 py-1 font-mono text-[11px] font-semibold tracking-[0.14em] text-ink">
              GUEST
            </span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {started && (
            <button
              type="button"
              onClick={() => setMessages([])}
              className="rounded-lg border border-line px-3 py-2 font-mono text-[12px] font-semibold tracking-[0.1em] text-ink transition-colors hover:border-signal/50"
            >
              + NEW CHAT
            </button>
          )}
          {loading ? null : session ? (
            <Link
              to="/chat"
              className="rounded-lg bg-gradient-to-r from-signal to-voice px-4 py-2 font-mono text-[12px] font-semibold tracking-[0.12em] text-white transition-opacity hover:opacity-90"
            >
              MY SESSIONS
            </Link>
          ) : (
            <>
              <Link
                to="/auth"
                className="rounded-lg border border-line px-4 py-2 font-mono text-[12px] font-semibold tracking-[0.12em] text-ink transition-colors hover:border-voice/50"
              >
                SIGN IN
              </Link>
              <Link
                to="/auth"
                className="rounded-lg bg-gradient-to-r from-signal to-voice px-4 py-2 font-mono text-[12px] font-semibold tracking-[0.12em] text-white transition-opacity hover:opacity-90"
              >
                SIGN UP
              </Link>
            </>
          )}
        </div>
      </header>

      {!started ? (
        <div className="relative z-10 flex flex-1 flex-col items-center overflow-y-auto px-4 pb-10 pt-8">
          <div className="m-auto w-full max-w-2xl">
            <div className="mb-7 text-center">
              <div className="flex items-center justify-center gap-4">
                <span aria-hidden className="h-px w-12 shrink-0 bg-gradient-to-r from-transparent to-voice/80" />
                <img
                  src={logo}
                  alt="Ultron core"
                  className="logo-glow-lg h-24 w-auto shrink-0 object-contain sm:h-28"
                />
                <span aria-hidden className="h-px w-12 shrink-0 bg-gradient-to-l from-transparent to-voice/80" />
              </div>
              <div className="mt-6 font-mono text-[11px] tracking-[0.4em] text-dim">
                ULTRON CORE READY
              </div>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
                What can I help with, <span className="text-gradient">operator?</span>
              </h1>
              <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-ink/70">
                Ask anything — questions, code, explanations, ideas. No
                account needed, and your chat stays right here in this tab.
              </p>
            </div>
            {prompt}
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {CARDS.map(({ icon: Icon, title, desc, prompt: cardPrompt }) => (
                <button
                  key={title}
                  type="button"
                  onClick={() => send(cardPrompt)}
                  className="group flex items-start gap-3 rounded-xl border border-line/70 bg-panel/50 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-voice/40 hover:bg-panel hover:shadow-[0_0_24px_-8px_var(--color-voice)]"
                >
                  <Icon className="mt-0.5 size-5 shrink-0 text-voice" />
                  <span>
                    <span className="block text-[15px] font-medium text-ink">{title}</span>
                    <span className="mt-0.5 block text-[13px] text-dim">{desc}</span>
                  </span>
                </button>
              ))}
            </div>
            <p className="mt-6 text-center text-xs text-dim">
              Ultron can make mistakes — double-check important info.
            </p>
          </div>
        </div>
      ) : (
        <>
          <Conversation className="min-h-0 flex-1">
            <ConversationContent className="mx-auto w-full max-w-3xl">
              {messages.map((m) => {
                const text = textOf(m);
                return (
                  <Message key={m.id} from={m.role === "user" ? "user" : "assistant"}>
                    <MessageContent>
                      {m.role === "user" ? text : <MessageResponse>{text}</MessageResponse>}
                    </MessageContent>
                    {m.role === "assistant" && text && (
                      <button
                        type="button"
                        onClick={() => copyText(m.id, text)}
                        className="flex w-fit items-center gap-1.5 rounded-md px-1.5 py-1 text-[11px] text-dim transition-colors hover:text-ink"
                      >
                        {copiedId === m.id ? (
                          <>
                            <Check className="size-3.5 text-voice" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="size-3.5" />
                            Copy
                          </>
                        )}
                      </button>
                    )}
                  </Message>
                );
              })}
              {status === "submitted" && (
                <Message from="assistant">
                  <MessageContent>
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
            {messages.length >= 2 && (
              <div className="mb-2 flex items-center justify-center gap-2 rounded-md border border-line bg-panel px-3 py-2 text-center text-xs text-ink/70">
                <span>This guest chat isn't saved.</span>
                {session ? (
                  <Link
                    to="/chat"
                    className="font-mono text-[11px] tracking-wider text-voice hover:opacity-80"
                  >
                    OPEN MY SESSIONS →
                  </Link>
                ) : (
                  <Link
                    to="/auth"
                    className="font-mono text-[11px] tracking-wider text-voice hover:opacity-80"
                  >
                    SIGN UP TO KEEP IT →
                  </Link>
                )}
              </div>
            )}
            {prompt}
          </div>
        </>
      )}
    </div>
  );
}
