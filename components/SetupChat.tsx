"use client";

import { useChat } from "@ai-sdk/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { UIMessage } from "ai";

const WELCOME: UIMessage = {
  id: "welcome",
  role: "assistant",
  parts: [
    {
      type: "text",
      text: "Tell me what you'd like Vigil to do. Who should I contact? What should happen to your files and repos?",
    },
  ],
  metadata: undefined,
};

export function SetupChat() {
  const router = useRouter();
  const bottomRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");

  const { messages, sendMessage, status } = useChat({
    messages: [WELCOME],
  });

  const isLoading = status === "streaming" || status === "submitted";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const setupConfirmed = messages.some((m) =>
    m.parts?.some(
      (p) =>
        p.type === "tool-invocation" &&
        (p as { toolName?: string }).toolName === "confirmSetup",
    ),
  );

  useEffect(() => {
    if (setupConfirmed) {
      const t = setTimeout(() => router.push("/dashboard"), 1500);
      return () => clearTimeout(t);
    }
  }, [setupConfirmed, router]);

  function getTextContent(m: UIMessage): string {
    return (
      m.parts
        ?.filter((p) => p.type === "text")
        .map((p) => (p as { type: "text"; text: string }).text)
        .join("") ?? ""
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isLoading || setupConfirmed) return;
    sendMessage({ role: "user", parts: [{ type: "text", text: input }] });
    setInput("");
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 p-4">
        {messages.map((m) => {
          const text = getTextContent(m);
          if (!text) return null;
          return (
            <div
              key={m.id}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`
                  max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed
                  ${
                    m.role === "user"
                      ? "bg-zinc-700 text-zinc-100 rounded-br-sm"
                      : "bg-zinc-800 text-zinc-200 rounded-bl-sm"
                  }
                `}
              >
                {text}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-zinc-800 rounded-2xl rounded-bl-sm px-4 py-3">
              <span className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce"
                    style={{ animationDelay: `${i * 150}ms` }}
                  />
                ))}
              </span>
            </div>
          </div>
        )}

        {setupConfirmed && (
          <div className="text-center py-4">
            <span className="inline-block px-4 py-2 rounded-full bg-emerald-900/50 text-emerald-400 border border-emerald-800 text-sm font-medium">
              Plan saved — redirecting to dashboard…
            </span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="border-t border-zinc-800 p-4 flex gap-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Describe your wishes…"
          disabled={isLoading || setupConfirmed}
          className="
            flex-1 bg-zinc-800 text-zinc-100 placeholder:text-zinc-500
            rounded-xl px-4 py-3 text-sm
            border border-zinc-700 focus:border-zinc-500
            focus:outline-none transition-colors
            disabled:opacity-50
          "
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim() || setupConfirmed}
          className="
            px-5 py-3 rounded-xl text-sm font-medium
            bg-zinc-700 hover:bg-zinc-600 text-zinc-100
            border border-zinc-600 transition-colors
            disabled:opacity-50 disabled:cursor-not-allowed
          "
        >
          Send
        </button>
      </form>
    </div>
  );
}
