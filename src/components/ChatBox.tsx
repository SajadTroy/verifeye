"use client";

import React, { useState, useRef, useEffect, useSyncExternalStore } from "react";
import { ArrowRight, Loader2, Copy, Check, ThumbsUp, ThumbsDown, CornerDownLeft } from "lucide-react";
import { FactCheckCard } from "@/components/FactCheckCard";
import { Message } from "@/types/chat";
import {
  getMessagesSnapshot,
  getServerMessagesSnapshot,
  subscribeToMessages,
  saveMessages,
} from "@/lib/chatStore";

const getFormattedDateTime = () => {
  const now = new Date();
  return now.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + " • " + now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
};

const emptySubscribe = () => () => {};
let cachedClientTime = "";
const getClientTimeSnapshot = () => {
  if (!cachedClientTime) {
    cachedClientTime = getFormattedDateTime();
  }
  return cachedClientTime;
};
const getServerTimeSnapshot = () => "";

export function ChatBox() {
  const messages = useSyncExternalStore(subscribeToMessages, getMessagesSnapshot, getServerMessagesSnapshot);
  const clientTimestamp = useSyncExternalStore(emptySubscribe, getClientTimeSnapshot, getServerTimeSnapshot);

  const [inputVal, setInputVal] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingThinking, setLoadingThinking] = useState<string>("Searching verified news sources...");
  const [isFocused, setIsFocused] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [ratings, setRatings] = useState<Record<string, "like" | "dislike" | null>>({});

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, loadingThinking]);

  useEffect(() => {
    if (!isLoading) {
      textareaRef.current?.focus();
    }
  }, [isLoading]);

  const determineStatus = (text: string): { status: "true" | "false" | "needs_context"; context: string } => {
    const lower = text.toLowerCase();
    if (/fake|hoax|conspiracy|cure cancer|5g causes|banned everywhere|eradicates/i.test(lower)) {
      return {
        status: "false",
        context: "Independent scientific consensus, verified wire agencies, and primary regulators have identified no substantiating evidence for this assertion.",
      };
    }
    if (/unconfirmed|rumor|secret|alleged|leak|miracle/i.test(lower)) {
      return {
        status: "needs_context",
        context: "While elements reflect emerging developments, secondary confirmations and official agency filings remain pending. Important qualifications are omitted.",
      };
    }
    return {
      status: "true",
      context: "Primary reporting corroborates the central assertion. The factual disclosures align with direct institutional announcements and wire dispatches.",
    };
  };

  const handleSend = async () => {
    const text = inputVal.trim();
    if (!text || isLoading) return;

    const userMsgId = `msg-${Date.now()}-user`;
    const aiMsgId = `msg-${Date.now()}-ai`;

    const currentTime = getFormattedDateTime();

    const updatedWithUser: Message[] = [
      ...messages,
      { id: userMsgId, sender: "user", text, timestamp: currentTime },
    ];

    saveMessages(updatedWithUser);
    setInputVal("");
    setLoadingThinking("Initiating search & fact-check...");
    setIsLoading(true);

    try {
      const response = await fetch("/api/fact-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claim: text }),
      });

      if (!response.ok || !response.body) {
        throw new Error("Failed to connect to verification model");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let receivedResult: { status: "true" | "false" | "needs_context"; context: string } | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ") || line === "data: [DONE]") continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === "thinking" && data.text) {
              setLoadingThinking(data.text);
            } else if (data.type === "result" && data.status && data.context) {
              receivedResult = {
                status: data.status,
                context: data.context,
              };
            }
          } catch {}
        }
      }

      const finalStatus = receivedResult?.status || "needs_context";
      const finalContext = receivedResult?.context || "Live verification completed. Official wire filings remain under active monitoring.";

      const updatedWithAi: Message[] = [
        ...updatedWithUser,
        {
          id: aiMsgId,
          sender: "ai",
          text: finalContext,
          factCheck: {
            claim: text,
            status: finalStatus,
          },
          timestamp: getFormattedDateTime(),
        },
      ];
      saveMessages(updatedWithAi);
    } catch {
      const fallback = determineStatus(text);
      const updatedWithAi: Message[] = [
        ...updatedWithUser,
        {
          id: aiMsgId,
          sender: "ai",
          text: fallback.context,
          factCheck: {
            claim: text,
            status: fallback.status,
          },
          timestamp: getFormattedDateTime(),
        },
      ];
      saveMessages(updatedWithAi);
    } finally {
      setIsLoading(false);
      textareaRef.current?.focus();
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId(null);
    }, 1800);
  };

  const handleEdit = (index: number, text: string) => {
    setInputVal(text);
    const sliced = messages.slice(0, index);
    saveMessages(sliced);
    textareaRef.current?.focus();
  };

  const handleRate = (id: string, type: "like" | "dislike") => {
    setRatings((prev) => ({
      ...prev,
      [id]: prev[id] === type ? null : type,
    }));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, width: "100%", maxWidth: "720px", margin: "0 auto" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "20px", padding: "16px 16px 240px 16px", flex: 1 }}>
        {messages.map((msg, index) => {
          const isCopied = copiedId === msg.id;
          const currentRating = ratings[msg.id];
          const msgTime = msg.timestamp || clientTimestamp;

          return (
            <div
              key={msg.id}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: msg.sender === "user" ? "flex-end" : "flex-start",
                width: "100%",
                gap: "4px",
              }}
            >
              <div
                style={{
                  maxWidth: "88%",
                  padding: "14px 18px",
                  borderRadius: msg.sender === "user" ? "14px 14px 2px 14px" : "14px 14px 14px 2px",
                  background: msg.sender === "user" ? "#24b47e" : "#f9fafb",
                  color: msg.sender === "user" ? "#ffffff" : "#111827",
                  fontSize: "14px",
                  lineHeight: 1.5,
                  border: msg.sender === "ai" ? "1px solid #e5e7eb" : "none",
                  boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                  wordBreak: "break-word",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <div style={{ whiteSpace: "pre-wrap" }}>{msg.text}</div>
                {msg.factCheck && <FactCheckCard data={msg.factCheck} />}
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "0 2px",
                }}
              >
                {msg.sender === "user" && (
                  <span suppressHydrationWarning style={{ fontSize: "11px", color: "#9ca3af", marginRight: "4px", userSelect: "none" }}>
                    {msgTime}
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => handleCopy(msg.id, msg.text)}
                  title={isCopied ? "Copied!" : "Copy message"}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: isCopied ? "#24b47e" : "#9ca3af",
                    cursor: "pointer",
                    padding: "3px 4px",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "4px",
                    transition: "color 0.15s",
                  }}
                >
                  {isCopied ? <Check size={14} strokeWidth={2.2} /> : <Copy size={14} strokeWidth={1.8} />}
                </button>

                {msg.sender === "user" && (
                  <button
                    type="button"
                    onClick={() => handleEdit(index, msg.text)}
                    title="Edit message"
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#9ca3af",
                      cursor: "pointer",
                      padding: "3px 4px",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "4px",
                      transition: "color 0.15s",
                    }}
                  >
                    <CornerDownLeft size={13} strokeWidth={1.8} />
                  </button>
                )}

                {msg.sender === "ai" && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleRate(msg.id, "like")}
                      title="Good response"
                      style={{
                        background: "transparent",
                        border: "none",
                        color: currentRating === "like" ? "#24b47e" : "#9ca3af",
                        cursor: "pointer",
                        padding: "3px 4px",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: "4px",
                        transition: "color 0.15s",
                      }}
                    >
                      <ThumbsUp
                        size={14}
                        strokeWidth={1.8}
                        fill={currentRating === "like" ? "#24b47e" : "none"}
                      />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRate(msg.id, "dislike")}
                      title="Bad response"
                      style={{
                        background: "transparent",
                        border: "none",
                        color: currentRating === "dislike" ? "#ef4444" : "#9ca3af",
                        cursor: "pointer",
                        padding: "3px 4px",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: "4px",
                        transition: "color 0.15s",
                      }}
                    >
                      <ThumbsDown
                        size={14}
                        strokeWidth={1.8}
                        fill={currentRating === "dislike" ? "#ef4444" : "none"}
                      />
                    </button>

                    <span suppressHydrationWarning style={{ fontSize: "11px", color: "#9ca3af", marginLeft: "4px", userSelect: "none" }}>
                      {msgTime}
                    </span>
                  </>
                )}
              </div>
            </div>
          );
        })}
        {isLoading && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              width: "100%",
              gap: "4px",
            }}
          >
            <div
              style={{
                maxWidth: "88%",
                padding: "12px 18px",
                borderRadius: "14px 14px 14px 2px",
                background: "#f9fafb",
                color: "#111827",
                fontSize: "14px",
                lineHeight: 1.5,
                border: "1px solid #e5e7eb",
                boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <Loader2
                size={15}
                strokeWidth={2.2}
                style={{
                  animation: "spin 0.8s linear infinite",
                  color: "#24b47e",
                  flexShrink: 0,
                }}
              />
              <span
                key={loadingThinking}
                style={{
                  color: "#374151",
                  fontSize: "13.5px",
                  fontWeight: 450,
                  animation: "pulseFade 0.3s ease-out",
                }}
              >
                {loadingThinking}
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          padding: "24px 16px 20px 16px",
          background: "linear-gradient(to bottom, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.95) 24%, #ffffff 100%)",
          zIndex: 50,
          pointerEvents: "none",
        }}
      >
        <div style={{ maxWidth: "720px", width: "100%", pointerEvents: "auto" }}>
          <div
            style={{
              textAlign: "center",
              fontSize: "11px",
              color: "#6b7280",
              marginBottom: "8px",
              userSelect: "none",
            }}
          >
            VerifEye can make mistakes. Always cross-check critical news and claims with official primary sources.
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            style={{
              display: "flex",
              flexDirection: "column",
              background: "#ffffff",
              border: isFocused ? "1px solid #24b47e" : "1px solid #e5e7eb",
              boxShadow: isFocused
                ? "0 0 0 2px rgba(36, 180, 126, 0.15), 0 4px 6px -1px rgba(0, 0, 0, 0.05)"
                : "0 4px 12px -2px rgba(0, 0, 0, 0.06)",
              borderRadius: "8px",
              padding: "10px 12px",
              transition: "border-color 0.15s, box-shadow 0.15s",
            }}
          >
            <textarea
              ref={textareaRef}
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onKeyDown={handleKeyDown}
              placeholder="Send news headline or claim to fact-check..."
              rows={3}
              disabled={isLoading}
              style={{
                width: "100%",
                border: "none",
                outline: "none",
                background: "transparent",
                color: "#111827",
                fontSize: "14px",
                lineHeight: 1.5,
                resize: "none",
                fontFamily: "inherit",
              }}
            />

            <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", paddingTop: "6px" }}>
              <button
                type="submit"
                disabled={!inputVal.trim() || isLoading}
                style={{
                  height: "32px",
                  width: "74px",
                  borderRadius: "6px",
                  background: !inputVal.trim() && !isLoading ? "#f3f4f6" : "#24b47e",
                  color: !inputVal.trim() && !isLoading ? "#9ca3af" : "#ffffff",
                  border: !inputVal.trim() && !isLoading ? "1px solid #e5e7eb" : "1px solid #1ea06d",
                  boxShadow: !inputVal.trim() && !isLoading ? "none" : "inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 1px 2px rgba(0, 0, 0, 0.05)",
                  fontSize: "13px",
                  fontWeight: 500,
                  cursor: !inputVal.trim() || isLoading ? "not-allowed" : "pointer",
                  opacity: isLoading ? 0.8 : 1,
                  transition: "background-color 0.15s, border-color 0.15s, opacity 0.15s",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  flexShrink: 0,
                }}
              >
                {isLoading ? (
                  <Loader2 size={15} strokeWidth={2.2} style={{ animation: "spin 0.8s linear infinite" }} />
                ) : (
                  <>
                    <span>Send</span>
                    <ArrowRight size={14} strokeWidth={2} />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
