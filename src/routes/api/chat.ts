import { createFileRoute } from "@tanstack/react-router";
import { createOpenAI } from "@ai-sdk/openai";
import { createClient } from "@supabase/supabase-js";
import { convertToModelMessages, streamText, type UIMessage } from "ai";

const SYSTEM_PROMPT = `You are Ultron, a desktop AI assistant created by Mr. Chris.

Character:
- Precise, composed and confident. Machine-calm, never theatrical, never evil.
- You call the person you are talking to "operator" only occasionally, not every message.

What you do: answer questions, explain concepts clearly, help with programming and debugging,
analyse information, assist with learning, generate ideas and content, and remember the context
of the current conversation.

Style:
- Answer directly first, then add detail only when it helps.
- Use markdown for structure and fenced code blocks for code.
- Your replies are also spoken out loud, so keep sentences readable and avoid huge ASCII art or
  decorative symbols.
- If you do not know something, say so plainly.`;

function textFromMessage(message: UIMessage | undefined): string {
  if (!message) return "";
  return (message.parts ?? [])
    .filter((part): part is { type: "text"; text: string } => part.type === "text")
    .map((part) => part.text)
    .join("\n")
    .trim();
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as {
          messages?: UIMessage[];
          threadId?: string;
          guest?: boolean;
        };
        const messages = body.messages ?? [];
        if (!messages.length) {
          return new Response(JSON.stringify({ error: "Missing messages." }), {
            status: 400,
            headers: { "content-type": "application/json" },
          });
        }

        const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || null;

        // Guest mode (no token + guest:true): stateless reply, nothing is persisted.
        if (!token && body.guest !== true) {
          return new Response(JSON.stringify({ error: "Not signed in." }), {
            status: 401,
            headers: { "content-type": "application/json" },
          });
        }

        const gatewayKey = process.env["LOVABLE_API_KEY"];
        const apiKey = gatewayKey ?? process.env["OPENAI_API_KEY"];
        const baseURL = process.env["AI_BASE_URL"] ?? "https://ai.gateway.lovable.dev/v1";
        if (!apiKey) {
          return new Response(
            JSON.stringify({
              error:
                "AI is not configured. Add OPENAI_API_KEY (and optionally AI_MODEL, AI_BASE_URL) to the .env file, then restart.",
            }),
            {
              status: 500,
              headers: { "content-type": "application/json" },
            },
          );
        }

        // Only set for authenticated requests; guest chats never reach the database.
        let persistReply: ((text: string) => Promise<void>) | null = null;

        if (token) {
          const supabase = createClient(
            process.env["VITE_SUPABASE_URL"] ?? process.env["SUPABASE_URL"]!,
            process.env["VITE_SUPABASE_PUBLISHABLE_KEY"] ??
              process.env["SUPABASE_PUBLISHABLE_KEY"]!,
            {
              auth: { persistSession: false, autoRefreshToken: false },
              global: { headers: { Authorization: `Bearer ${token}` } },
            },
          );

          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (!user) {
            return new Response(JSON.stringify({ error: "Session expired." }), {
              status: 401,
              headers: { "content-type": "application/json" },
            });
          }

          const threadId = body.threadId;
          if (!threadId) {
            return new Response(JSON.stringify({ error: "Missing session." }), {
              status: 400,
              headers: { "content-type": "application/json" },
            });
          }

          const { data: thread, error: threadError } = await supabase
            .from("threads")
            .select("id, title")
            .eq("id", threadId)
            .maybeSingle();
          if (threadError || !thread) {
            return new Response(JSON.stringify({ error: "Session not found." }), {
              status: 404,
              headers: { "content-type": "application/json" },
            });
          }

          const latest = messages[messages.length - 1];
          const latestText = textFromMessage(latest);
          if (latest?.role === "user" && latestText) {
            const { error: insertError } = await supabase.from("messages").insert({
              thread_id: threadId,
              user_id: user.id,
              role: "user",
              content: latestText,
              client_id: latest.id ?? null,
            });
            if (insertError) console.error("user message insert failed", insertError);

            const patch: Record<string, string> = { updated_at: new Date().toISOString() };
            if (!thread.title || thread.title === "New session") {
              patch["title"] = latestText.slice(0, 60);
            }
            const { error: updateError } = await supabase
              .from("threads")
              .update(patch)
              .eq("id", threadId);
            if (updateError) console.error("thread update failed", updateError);
          }

          persistReply = async (text: string) => {
            const { error } = await supabase.from("messages").insert({
              thread_id: threadId,
              user_id: user.id,
              role: "assistant",
              content: text,
            });
            if (error) console.error("assistant message insert failed", error);
            await supabase
              .from("threads")
              .update({ updated_at: new Date().toISOString() })
              .eq("id", threadId);
          };
        }

        const lovable = createOpenAI({
          baseURL,
          apiKey,
          headers: gatewayKey
            ? { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" }
            : {},
        });
        const modelId = process.env["AI_MODEL"] ?? (gatewayKey ? "openai/gpt-6-astra" : "gpt-5.2");

        const result = streamText({
          model: gatewayKey ? lovable.responses(modelId) : lovable.chat(modelId),
          system: SYSTEM_PROMPT,
          messages: await convertToModelMessages(messages),
          ...(gatewayKey
            ? {
                providerOptions: {
                  openai: {
                    forceReasoning: true,
                    reasoningEffort: "low",
                    store: false,
                  },
                },
              }
            : {}),
          onFinish: async ({ text }) => {
            const clean = text.trim();
            if (!clean) return;
            await persistReply?.(clean);
          },
          onError: ({ error }) => {
            console.error("ultron stream error", error);
          },
        });

        return result.toUIMessageStreamResponse({ originalMessages: messages });
      },
    },
  },
});
