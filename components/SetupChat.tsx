"use client";

import { useChat } from "@ai-sdk/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { UIMessage } from "ai";
import { Button } from "@/components/Button";
import Link from "next/link";

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

const SUGGESTED_PROMPTS = [
  "After 7 days, email my sister Priya and tell her I was grateful.",
  "After 14 days, transfer my repo agspades/vigil to arjun-dev.",
  "Archive my Google Drive and share it with my spouse after a week.",
];

export function SetupChat({
  connectedServices = [],
}: {
  connectedServices?: string[];
}) {
  const router = useRouter();
  const bottomRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");

  const { messages, sendMessage, status, error } = useChat({
    messages: [WELCOME],
  });

  const isLoading = status === "streaming" || status === "submitted";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const setupConfirmed = messages.some((message) =>
    message.parts?.some(
      (part) =>
        part.type === "tool-confirmSetup" &&
        "state" in part &&
        part.state === "output-available",
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

  function renderToolPart(
    part: Record<string, unknown>,
    key: string,
  ): ReactNode {
    const type = typeof part.type === "string" ? part.type : "";
    if (!type.startsWith("tool-")) {
      return null;
    }

    const toolName = type.replace(/^tool-/, "");
    const state = typeof part.state === "string" ? part.state : "input-available";

    const labels: Record<string, string> = {
      saveAction: "Queued action",
      saveContact: "Saved contact context",
      confirmSetup: "Setup confirmed",
    };

    let body = "Working...";

    if (state === "input-available") {
      body = "The agent is preparing this step.";
    } else if (state === "output-available") {
      body = "Completed successfully.";
    } else if (state === "output-error") {
      body =
        typeof part.errorText === "string"
          ? part.errorText
          : "This tool step failed.";
    }

    return (
      <div
        key={key}
        className="mt-3 rounded-[2px] border border-vigil-borderSubtle bg-vigil-bgPri/60 px-3 py-2"
      >
        <div className="flex items-center justify-between gap-3">
          <span className="text-[11px] uppercase tracking-[0.12em] text-vigil-accentPri">
            {labels[toolName] ?? toolName}
          </span>
          <span className="text-[10px] uppercase tracking-[0.1em] text-vigil-textTer">
            {state.replaceAll("-", " ")}
          </span>
        </div>
        <p className="mt-2 text-[12px] text-vigil-textSec">{body}</p>
      </div>
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isLoading || setupConfirmed) return;
    sendMessage({ role: "user", parts: [{ type: "text", text: input }] });
    setInput("");
  }

  return (
    <div className="h-[calc(100vh-72px)] bg-vigil-bgPri flex flex-col md:flex-row text-vigil-textPri overflow-hidden fade-up">
      <div className="flex flex-col md:w-[360px] w-full border-b md:border-b-0 md:border-r border-vigil-borderSubtle p-6 md:p-10 max-h-[35vh] md:max-h-none h-auto md:h-full flex-shrink-0 bg-vigil-bgSec overflow-y-auto">
        <h2 className="font-serif text-[22px] tracking-[0.2em] mb-12 uppercase text-vigil-textPri font-light">
          Vigil
        </h2>
        <div className="text-[11px] font-sans uppercase tracking-[0.16em] text-vigil-textSec mb-6">
          SETUP GUIDE
        </div>

        <ul className="flex flex-col gap-6 mb-12 flex-grow">
          <li className="flex items-start gap-4">
            <span className="text-vigil-accentPri text-[14px]">●</span>
            <span className="text-[14px] text-vigil-textSec font-light leading-relaxed">
              Tell Vigil who to contact and when.
            </span>
          </li>
          <li className="flex items-start gap-4">
            <span className="text-vigil-accentPri text-[14px]">●</span>
            <span className="text-[14px] text-vigil-textSec font-light leading-relaxed">
              Mention your relationship so the message sounds like you.
            </span>
          </li>
          <li className="flex items-start gap-4">
            <span className="text-vigil-accentPri text-[14px]">●</span>
            <span className="text-[14px] text-vigil-textSec font-light leading-relaxed">
              Vigil confirms the plan before saving any actions.
            </span>
          </li>
        </ul>

        <div className="flex gap-2 flex-wrap">
          {connectedServices.length > 0 ? (
            connectedServices.map((service) => (
              <span
                key={service}
                className="px-3 py-1 bg-vigil-bgSec border border-vigil-borderSubtle text-[11px] text-vigil-textPri uppercase tracking-[0.1em] rounded-[2px] cursor-default"
              >
                {service} ✓
              </span>
            ))
          ) : (
            <div className="flex flex-col items-start gap-3">
              <span className="text-[12px] text-vigil-textTer">
                No connected services yet.
              </span>
              <Link href="/onboarding/connect">
                <Button variant="secondary" className="!h-[36px] !px-4 text-[11px]">
                  Connect accounts
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="flex-grow flex flex-col bg-vigil-bgPri h-full relative">
        <div className="h-[60px] flex-shrink-0 border-b border-vigil-borderSubtle flex items-center justify-center">
          <span className="text-[12px] font-sans uppercase tracking-[0.12em] text-vigil-textPri">
            VIGIL SETUP
          </span>
        </div>

        <div className="flex-grow overflow-y-auto p-4 sm:p-8 relative">
          <div className="max-w-[680px] mx-auto flex flex-col gap-8 pb-[120px]">
            {messages.map((m) => {
              const text = getTextContent(m);
              const toolParts = m.parts
                .map((part, index) =>
                  renderToolPart(
                    part as unknown as Record<string, unknown>,
                    `${m.id}-tool-${index}`,
                  ),
                )
                .filter(Boolean);

              if (!text && toolParts.length === 0) return null;

              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"} fade-up delay-100`}
                >
                  <div
                    className={`p-4 max-w-[85%] ${
                      m.role === "user"
                        ? "bg-vigil-bgTer text-vigil-textPri rounded-[4px_4px_0_4px]"
                        : "bg-vigil-bgSec border border-vigil-borderSubtle text-vigil-textPri rounded-[4px_4px_4px_0]"
                    }`}
                  >
                    {text ? (
                      <p className="text-[15px] font-light leading-relaxed whitespace-pre-wrap break-words min-w-0">
                        {text}
                      </p>
                    ) : null}
                    {toolParts}
                  </div>
                  <span className="text-[11px] text-vigil-textTer font-mono mt-2">
                    {new Date().toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-vigil-bgSec border border-vigil-borderSubtle rounded-[4px_4px_4px_0] px-4 py-3">
                  <span className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-vigil-textTer animate-bounce"
                        style={{ animationDelay: `${i * 150}ms` }}
                      />
                    ))}
                  </span>
                </div>
              </div>
            )}

            {error ? (
              <div className="rounded-[2px] border border-vigil-statusDownBorder bg-vigil-statusDownBg px-4 py-3 text-[13px] text-vigil-textPri">
                {error.message}
              </div>
            ) : null}

            {setupConfirmed && (
              <div className="text-center py-4">
                <span className="inline-block px-4 py-2 rounded-[2px] bg-vigil-statusWatchBg text-vigil-statusWatch border border-vigil-statusWatchBorder text-sm font-medium">
                  Plan saved. Redirecting to dashboard...
                </span>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        </div>

        <div className="absolute bottom-0 w-full border-t border-vigil-borderSubtle bg-vigil-bgPri p-4 sm:p-5 md:px-[40px]">
          <div className="max-w-[680px] mx-auto">
            {!input && messages.length <= 1 ? (
              <div className="mb-3 flex flex-wrap gap-2">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => setInput(prompt)}
                    className="rounded-[2px] border border-vigil-borderSubtle px-3 py-2 text-[11px] uppercase tracking-[0.08em] text-vigil-textSec hover:text-vigil-textPri hover:border-vigil-borderActive transition-colors"
                  >
                    Use example
                  </button>
                ))}
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="flex gap-4 items-end">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                placeholder="Describe your wishes..."
                disabled={isLoading || setupConfirmed}
                className="flex-grow bg-vigil-bgSec border border-vigil-borderSubtle rounded-[2px] text-vigil-textPri text-[15px] p-4 min-h-[52px] max-h-[160px] focus:outline-none focus:border-vigil-borderActive transition-colors resize-none placeholder:text-vigil-textTer overflow-y-auto disabled:opacity-50"
                rows={1}
              />
              <Button
                type="submit"
                variant="primary"
                disabled={isLoading || !input.trim() || setupConfirmed}
                className="w-[52px] !px-0 flex-shrink-0"
              >
                ↑
              </Button>
            </form>

            <div className="flex justify-between items-center mt-3">
              <p className="text-[11px] text-vigil-textTer">
                Vigil will ask clarifying questions before saving anything.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
