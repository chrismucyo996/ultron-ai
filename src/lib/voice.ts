export type VoiceProfile = {
  id: string;
  name: string;
  desc: string;
  pitch: number;
  rate: number;
  gender: "male" | "female";
};

export const VOICE_PROFILES: VoiceProfile[] = [
  {
    id: "bright_male",
    name: "Bright Male",
    desc: "Energetic, fast",
    pitch: 1.25,
    rate: 1.1,
    gender: "male",
  },
  {
    id: "teen_male",
    name: "Teen Male",
    desc: "Youthful, casual",
    pitch: 1.15,
    rate: 1.1,
    gender: "male",
  },
  {
    id: "deep_male",
    name: "Deep Male",
    desc: "Authoritative, resonant",
    pitch: 0.85,
    rate: 1.05,
    gender: "male",
  },
  {
    id: "soft_female",
    name: "Soft Female",
    desc: "Gentle, warm",
    pitch: 1.3,
    rate: 1.05,
    gender: "female",
  },
  {
    id: "bright_female",
    name: "Bright Female",
    desc: "Clear, energetic",
    pitch: 1.4,
    rate: 1.1,
    gender: "female",
  },
];

export const DEFAULT_PROFILE_ID = "bright_male";

export function getProfile(id: string): VoiceProfile {
  return VOICE_PROFILES.find((p) => p.id === id) ?? (VOICE_PROFILES[0] as VoiceProfile);
}

const MALE_HINTS = ["male", "guy", "david", "daniel", "alex", "fred", "george", "james"];
const FEMALE_HINTS = ["female", "zira", "samantha", "victoria", "karen", "susan", "aria", "jenny"];

/** Pick the closest installed system voice for a profile. */
export function matchSystemVoice(
  voices: SpeechSynthesisVoice[],
  profile: VoiceProfile,
): SpeechSynthesisVoice | undefined {
  const english = voices.filter((v) => v.lang?.toLowerCase().startsWith("en"));
  const pool = english.length ? english : voices;
  const hints = profile.gender === "male" ? MALE_HINTS : FEMALE_HINTS;
  const hinted = pool.find((v) => hints.some((h) => v.name.toLowerCase().includes(h)));
  if (hinted) return hinted;
  // Deterministic fallback so each profile still sounds distinct.
  const index = VOICE_PROFILES.findIndex((p) => p.id === profile.id);
  return pool[index % Math.max(pool.length, 1)] ?? pool[0];
}

/** Strip markdown so the spoken text matches what a person would read aloud. */
export function speakableText(raw: string): string {
  return raw
    .replace(/```[\s\S]*?```/g, " code block ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/(\*\*|__|\*|_|~~)/g, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/\|/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
