import { FactCheckData } from "@/components/FactCheckCard";

export interface Message {
  id: string;
  sender: "ai" | "user";
  text: string;
  factCheck?: FactCheckData;
  timestamp: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: string;
}
