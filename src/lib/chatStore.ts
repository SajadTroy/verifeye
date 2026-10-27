import { Message } from "@/types/chat";

const STORAGE_KEY = "verifeye_chat_history";

export const createInitialMessages = (): Message[] => [
  {
    id: "initial-msg",
    sender: "ai",
    text: "Hello! I am VerifEye, your AI news verification assistant. Send me any breaking news headline or viral claim, and I will fact-check it for you.",
    timestamp: "",
  },
];

const SERVER_MESSAGES = createInitialMessages();
let currentMessages: Message[] = createInitialMessages();
let isInitialized = false;
const listeners = new Set<() => void>();

const notify = () => {
  listeners.forEach((l) => l());
};

function initIfNeeded() {
  if (typeof window === "undefined" || isInitialized) return;
  isInitialized = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        currentMessages = parsed;
      }
    }
  } catch {}
}

export function getMessagesSnapshot(): Message[] {
  initIfNeeded();
  return currentMessages;
}

export function getServerMessagesSnapshot(): Message[] {
  return SERVER_MESSAGES;
}

export function subscribeToMessages(callback: () => void): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

export function saveMessages(newMessages: Message[]) {
  currentMessages = newMessages;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(newMessages));
    } catch {}
  }
  notify();
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY) {
      isInitialized = false;
      initIfNeeded();
      notify();
    }
  });
}
