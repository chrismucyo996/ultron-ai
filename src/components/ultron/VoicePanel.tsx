import { VOICE_PROFILES, getProfile } from "@/lib/voice";

export function VoicePanel({
  profileId,
  onSelect,
  onPreview,
  supported,
}: {
  profileId: string;
  onSelect: (id: string) => void;
  onPreview: () => void;
  supported: boolean;
}) {
  const profile = getProfile(profileId);

  return (
    <div className="mx-3 mb-2 rounded-lg border border-line bg-panel p-3">
      <div className="flex items-center justify-between">
        <div className="font-mono text-[11px] font-semibold tracking-[0.14em] text-dim brightness-150">
          VOICE PROFILE
        </div>
        <button
          type="button"
          onClick={onPreview}
          className="font-mono text-[10px] font-semibold tracking-[0.1em] text-voice transition-opacity hover:opacity-70"
        >
          TEST
        </button>
      </div>

      <div className="mt-2 text-[13px] font-medium text-ink">{profile.name}</div>
      <div className="mt-0.5 font-mono text-[11px] font-medium tracking-[0.08em] text-dim brightness-150">
        {profile.desc}
      </div>

      <div className="mt-2 flex items-center gap-1.5">
        <span className="w-10 shrink-0 font-mono text-[10px] font-medium tracking-[0.08em] text-dim brightness-150">
          RATE
        </span>
        <div className="h-1 flex-1 rounded bg-line">
          <div
            className="h-1 rounded bg-voice"
            style={{ width: `${Math.min(profile.rate / 1.6, 1) * 100}%` }}
          />
        </div>
      </div>
      <div className="mt-1.5 flex items-center gap-1.5">
        <span className="w-10 shrink-0 font-mono text-[10px] font-medium tracking-[0.08em] text-dim brightness-150">
          PITCH
        </span>
        <div className="h-1 flex-1 rounded bg-line">
          <div
            className="h-1 rounded bg-voice"
            style={{ width: `${Math.min(profile.pitch / 2, 1) * 100}%` }}
          />
        </div>
      </div>

      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {VOICE_PROFILES.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onSelect(option.id)}
            className={
              option.id === profileId
                ? "rounded-md border border-voice/50 px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-voice"
                : "rounded-md border border-line px-2 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-dim brightness-150 transition-colors hover:text-ink"
            }
          >
            {option.name.split(" ")[0]}
            <span className="ml-1 opacity-60">{option.gender === "male" ? "M" : "F"}</span>
          </button>
        ))}
      </div>

      {!supported && (
        <div className="mt-2 font-mono text-[11px] font-medium tracking-[0.04em] text-dim brightness-150">
          This browser has no speech engine.
        </div>
      )}
    </div>
  );
}
