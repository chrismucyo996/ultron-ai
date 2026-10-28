import { createFileRoute } from "@tanstack/react-router";
import { LandingChat } from "@/components/ultron/LandingChat";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ultron AI — ask anything, no account needed" },
      {
        name: "description",
        content:
          "Ultron AI is a conversational desktop assistant with five spoken voice profiles, saved sessions and a dark or bright command interface.",
      },
      { property: "og:title", content: "Ultron AI — desktop assistant by Mr. Chris" },
      {
        property: "og:description",
        content:
          "Ultron AI is a conversational desktop assistant with five spoken voice profiles, saved sessions and a dark or bright command interface.",
      },
    ],
  }),
  ssr: false,
  component: LandingPage,
});

function LandingPage() {
  return <LandingChat />;
}
