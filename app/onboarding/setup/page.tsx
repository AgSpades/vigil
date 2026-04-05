"use client";

import { useChat } from "@ai-sdk/react";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/Button";
import Link from "next/link";

import { UIMessage } from "ai";

export default function SetupChatPage() {
  const { messages, sendMessage } = useChat({
    messages: [
      {
        id: "initial",
        role: "assistant",
        parts: [
          {
            type: "text",
            text: "Tell me what you'd like to happen. Who should I contact, and when? You can also tell me about the people — it helps me write something that sounds like you.",
          },
        ],
      },
    ] as UIMessage[],
  });

  const [input, setInput] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    // Mock functionality since there is no actual AI chat API hook setup in the backend
    sendMessage
      ? sendMessage({ role: "user", parts: [{ type: "text", text: input }] })
      : null;
    setInput("");
  };
  const [confirmed, setConfirmed] = useState(false);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (confirmed) {
    return (
      <main className="min-h-[calc(100vh-72px)] bg-vigil-bgPri flex flex-col items-center justify-center p-6 text-vigil-textPri text-center fade-up">
        <h1 className="font-serif text-[40px] font-light mb-6">
          Your vigil is set.
        </h1>
        <p className="text-[15px] text-vigil-textSec font-light mb-12 max-w-[400px]">
          We have recorded your final instructions. They are securely held and
          will only execute if your check-ins stop.
        </p>
        <Link href="/dashboard">
          <Button variant="primary">Go to dashboard </Button>
        </Link>
      </main>
    );
  }

  return (
    <main className="h-[calc(100vh-72px)] bg-vigil-bgPri flex flex-col md:flex-row text-vigil-textPri overflow-hidden fade-up">
      {/* Left Panel */}
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
              Mention your relationship — it shapes the message.
            </span>
          </li>
          <li className="flex items-start gap-4">
            <span className="text-vigil-accentPri text-[14px]">●</span>
            <span className="text-[14px] text-vigil-textSec font-light leading-relaxed">
              Vigil will confirm your plan before saving anything.
            </span>
          </li>
        </ul>

        {/* Connected account badges */}
        <div className="flex gap-2 flex-wrap">
          <span className="px-3 py-1 bg-vigil-bgSec border border-vigil-borderSubtle text-[11px] text-vigil-textSec uppercase tracking-[0.1em] rounded-[2px] cursor-default text-vigil-textPri">
            Gmail ✓
          </span>
        </div>
      </div>

      {/* Chat Panel */}
      <div className="flex-grow flex flex-col bg-vigil-bgPri h-full relative">
        {/* Top bar */}
        <div className="h-[60px] flex-shrink-0 border-b border-vigil-borderSubtle flex items-center justify-center">
          <span className="text-[12px] font-sans uppercase tracking-[0.12em] text-vigil-textPri">
            VIGIL SETUP
          </span>
        </div>

        {/* Scroll area */}
        <div className="flex-grow overflow-y-auto p-4 sm:p-8 relative">
          <div className="max-w-[680px] mx-auto flex flex-col gap-8 pb-[120px]">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"} fade-up delay-100`}
              >
                <div
                  className={`
                    p-4 max-w-[85%] 
                    ${
                      m.role === "user"
                        ? "bg-vigil-bgTer text-vigil-textPri rounded-[4px_4px_0_4px]"
                        : "bg-vigil-bgSec border border-vigil-borderSubtle text-vigil-textPri rounded-[4px_4px_4px_0]"
                    }
                  `}
                >
                  <p className="text-[15px] font-light leading-relaxed whitespace-pre-wrap break-words min-w-0">
                    {m.parts
                      .map((p) => (p.type === "text" ? p.text : ""))
                      .join("")}
                  </p>
                </div>
                <span className="text-[11px] text-vigil-textTer font-mono mt-2">
                  {new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            ))}
            <div ref={endOfMessagesRef} />
          </div>
        </div>

        {/* Input area */}
        <div className="absolute bottom-0 w-full border-t border-vigil-borderSubtle bg-vigil-bgPri p-4 sm:p-5 md:px-[40px]">
          <div className="max-w-[680px] mx-auto">
            <form onSubmit={handleSubmit} className="flex gap-4 items-end">
              <textarea
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Type your instructions..."
                className="flex-grow bg-vigil-bgSec border border-vigil-borderSubtle rounded-[2px] text-vigil-textPri text-[15px] p-4 min-h-[52px] max-h-[160px] focus:outline-none focus:border-vigil-borderActive transition-colors resize-none placeholder:text-vigil-textTer overflow-y-auto"
                rows={1}
              />
              <button
                type="submit"
                aria-label="Send instructions"
                disabled={!input.trim()}
                className="w-[52px] h-[52px] bg-vigil-accentPri hover:bg-vigil-accentSec disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-vigil-textPri rounded-[2px] transition-colors flex-shrink-0"
              >
                ↑
              </button>
            </form>
            <div className="flex justify-between items-center mt-3">
              <p className="text-[11px] text-vigil-textTer">
                Vigil will ask clarifying questions before saving anything.
              </p>
              <button
                type="button"
                onClick={() => setConfirmed(true)}
                className="text-[11px] text-vigil-textSec hover:text-white uppercase tracking-[0.1em]"
              >
                Finish Setup
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
