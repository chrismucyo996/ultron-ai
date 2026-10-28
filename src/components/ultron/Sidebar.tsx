import { Link } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { VoicePanel } from "./VoicePanel";
import type { Thread } from "@/lib/threads";
import logo from "@/assets/Neon Cyberpunk Robot Head Bust.png";

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return days === 1 ? "yesterday" : `${days}d ago`;
}

export function Sidebar({
  threads,
  activeId,
  onNewSession,
  onDelete,
  profileId,
  onSelectProfile,
  onPreviewVoice,
  speechSupported,
  theme,
  onToggleTheme,
  onSignOut,
  email,
  open,
  onClose,
}: {
  threads: Thread[];
  activeId: string;
  onNewSession: () => void;
  onDelete: (id: string) => void;
  profileId: string;
  onSelectProfile: (id: string) => void;
  onPreviewVoice: () => void;
  speechSupported: boolean;
  theme: "dark" | "light";
  onToggleTheme: () => void;
  onSignOut: () => void;
  email: string;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Close sessions"
          onClick={onClose}
          className="fixed inset-0 z-20 bg-background/70 md:hidden"
        />
      )}
      <aside
        className={`${
          open ? "flex" : "hidden"
        } fixed inset-y-0 left-0 z-30 w-[280px] shrink-0 flex-col border-r border-line bg-surface md:relative md:z-auto md:flex`}
      >
        <div className="border-b border-line px-4 pb-3 pt-4">
          <div className="flex items-center gap-2">
            <span className="size-2.5 shrink-0 animate-corepulse rounded-full bg-signal" />
            <img
              src={logo}
              alt="Ultron neon head"
              className="logo-glow h-9 w-auto shrink-0 object-contain"
            />
            <div className="truncate font-mono text-[13px] font-semibold tracking-[0.18em] text-ink">
              ULTRON&nbsp;CORE
            </div>
          </div>
          <div className="mt-1 font-mono text-[11px] font-medium tracking-[0.14em] text-dim brightness-150">
            CREATED&nbsp;BY&nbsp;MR.&nbsp;CHRIS
          </div>
        </div>

        <div className="px-3 py-3">
          <button
            type="button"
            onClick={onNewSession}
            className="flex w-full items-center justify-between rounded-lg border border-line bg-panel px-3 py-2.5 font-mono text-[12px] font-semibold tracking-[0.1em] text-ink transition-colors hover:border-signal/50"
          >
            <span>+ NEW&nbsp;SESSION</span>
          </button>
        </div>

        <div className="px-4 pb-2 pt-1 font-mono text-[11px] font-medium tracking-[0.14em] text-dim brightness-150">
          RECENT&nbsp;SESSIONS&nbsp;·&nbsp;{String(threads.length).padStart(2, "0")}
        </div>

        <div className="flex-1 space-y-px overflow-y-auto px-3">
          {threads.map((thread) => {
            const active = thread.id === activeId;
            return (
              <div
                key={thread.id}
                className={`group flex items-center gap-2 rounded-md px-3 py-2.5 ${
                  active ? "bg-panel ring-1 ring-signal/40" : "hover:bg-panel"
                }`}
              >
                <Link
                  to="/chat/$threadId"
                  params={{ threadId: thread.id }}
                  onClick={onClose}
                  className="min-w-0 flex-1"
                >
                  <div className="flex items-center gap-2">
                    {active && <span className="size-1.5 shrink-0 rounded-full bg-voice" />}
                    <div
                      className={`truncate text-[13px] font-medium ${active ? "text-ink" : "text-dim brightness-150"}`}
                    >
                      {thread.title}
                    </div>
                  </div>
                  <div className="mt-1 font-mono text-[10px] font-medium tracking-[0.12em] text-dim brightness-125">
                    {timeAgo(thread.updated_at)}
                  </div>
                </Link>
                <button
                  type="button"
                  aria-label="Delete session"
                  onClick={() => onDelete(thread.id)}
                  className="text-dim opacity-0 transition-opacity hover:text-signal group-hover:opacity-100"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            );
          })}
        </div>

        <VoicePanel
          profileId={profileId}
          onSelect={onSelectProfile}
          onPreview={onPreviewVoice}
          supported={speechSupported}
        />

        <div className="flex items-center justify-between border-t border-line px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="size-1.5 shrink-0 rounded-full bg-signal" />
            <span className="font-mono text-[11px] font-semibold tracking-[0.12em] text-ink">
              5&nbsp;VOICES
            </span>
          </div>
          <div className="flex shrink-0 overflow-hidden rounded-lg border border-line">
            <button
              type="button"
              onClick={theme === "light" ? onToggleTheme : undefined}
              className={`px-2.5 py-1 font-mono text-[10px] font-semibold tracking-[0.08em] ${
                theme === "dark" ? "bg-panel text-ink" : "text-dim brightness-150"
              }`}
            >
              DARK
            </button>
            <button
              type="button"
              onClick={theme === "dark" ? onToggleTheme : undefined}
              className={`px-2.5 py-1 font-mono text-[10px] font-semibold tracking-[0.08em] ${
                theme === "light" ? "bg-panel text-ink" : "text-dim brightness-150"
              }`}
            >
              LIGHT
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-line px-4 py-2.5">
          <span className="min-w-0 flex-1 truncate font-mono text-[10px] font-medium tracking-[0.08em] text-dim brightness-150">
            {email}
          </span>
          <button
            type="button"
            onClick={onSignOut}
            className="shrink-0 font-mono text-[10px] font-semibold tracking-[0.1em] text-ink transition-colors hover:text-signal"
          >
            SIGN OUT
          </button>
        </div>
      </aside>
    </>
  );
}
