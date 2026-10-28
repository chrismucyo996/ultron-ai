import type { UIMessage } from "ai";
import { supabase } from "@/integrations/supabase/client";

export type Thread = {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

export async function listThreads(): Promise<Thread[]> {
  const { data, error } = await supabase
    .from("threads")
    .select("id, title, created_at, updated_at")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createThread(userId: string, title = "New session"): Promise<Thread> {
  const { data, error } = await supabase
    .from("threads")
    .insert({ user_id: userId, title })
    .select("id, title, created_at, updated_at")
    .single();
  if (error) throw error;
  return data;
}

export async function deleteThread(id: string): Promise<void> {
  const { error } = await supabase.from("threads").delete().eq("id", id);
  if (error) throw error;
}

export async function renameThread(id: string, title: string): Promise<void> {
  const { error } = await supabase.from("threads").update({ title }).eq("id", id);
  if (error) throw error;
}

export async function loadMessages(threadId: string): Promise<UIMessage[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("id, role, content, created_at")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    role: row.role as "user" | "assistant",
    parts: [{ type: "text" as const, text: row.content }],
  }));
}

export type UserSettings = {
  voice_profile: string;
  theme: string;
  muted: boolean;
};

export async function loadSettings(userId: string): Promise<UserSettings> {
  const { data, error } = await supabase
    .from("user_settings")
    .select("voice_profile, theme, muted")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (data) return data;

  const { data: created, error: insertError } = await supabase
    .from("user_settings")
    .insert({ user_id: userId })
    .select("voice_profile, theme, muted")
    .single();
  if (insertError) throw insertError;
  return created;
}

export async function saveSettings(userId: string, patch: Partial<UserSettings>): Promise<void> {
  const { error } = await supabase
    .from("user_settings")
    .upsert({ user_id: userId, ...patch, updated_at: new Date().toISOString() });
  if (error) throw error;
}
