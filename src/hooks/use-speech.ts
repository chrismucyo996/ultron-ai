import { useCallback, useEffect, useRef, useState } from "react";
import { getProfile, matchSystemVoice, speakableText, type VoiceProfile } from "@/lib/voice";

export type SpeechState = {
  supported: boolean;
  speaking: boolean;
  paused: boolean;
  muted: boolean;
};

/**
 * Wraps the browser speech engine: profile-aware speaking plus
 * mute / pause / resume transport controls.
 */
export function useSpeech(profileId: string, initialMuted = false) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(initialMuted);
  const [supported, setSupported] = useState(false);
  const mutedRef = useRef(muted);
  const profileRef = useRef(profileId);

  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);
  useEffect(() => {
    profileRef.current = profileId;
  }, [profileId]);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    setSupported(true);
    const load = () => setVoices(window.speechSynthesis.getVoices());
    load();
    window.speechSynthesis.addEventListener("voiceschanged", load);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", load);
      window.speechSynthesis.cancel();
    };
  }, []);

  const buildUtterance = useCallback(
    (text: string, profile: VoiceProfile) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = profile.rate;
      utterance.pitch = profile.pitch;
      utterance.volume = 1;
      const match = matchSystemVoice(window.speechSynthesis.getVoices() ?? voices, profile);
      if (match) {
        utterance.voice = match;
        utterance.lang = match.lang;
      }
      return utterance;
    },
    [voices],
  );

  const speak = useCallback(
    (raw: string, options?: { force?: boolean }) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
      if (mutedRef.current && !options?.force) return;
      const text = speakableText(raw);
      if (!text) return;

      window.speechSynthesis.cancel();
      const utterance = buildUtterance(text, getProfile(profileRef.current));
      utterance.onstart = () => {
        setSpeaking(true);
        setPaused(false);
      };
      utterance.onend = () => {
        setSpeaking(false);
        setPaused(false);
      };
      utterance.onerror = () => {
        setSpeaking(false);
        setPaused(false);
      };
      window.speechSynthesis.speak(utterance);
    },
    [buildUtterance],
  );

  const stop = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
    setPaused(false);
  }, []);

  const pause = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
      setPaused(true);
    }
  }, []);

  const resume = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setPaused(false);
    }
  }, []);

  const toggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      if (next && typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        setSpeaking(false);
        setPaused(false);
      }
      return next;
    });
  }, []);

  return {
    supported,
    speaking,
    paused,
    muted,
    setMuted,
    toggleMute,
    speak,
    stop,
    pause,
    resume,
  };
}
