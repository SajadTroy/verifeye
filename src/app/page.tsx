import { Suspense } from "react";
import Image from "next/image";
import { ChatBox } from "@/components/ChatBox";

export default function Home() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#ffffff", color: "#000000" }}>
      <header
        style={{
          width: "100%",
          maxWidth: "720px",
          margin: "0 auto",
          padding: "32px 16px 20px 16px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          borderBottom: "1px solid #f1f5f9",
        }}
      >
        <div style={{ marginBottom: "12px" }}>
          <Image
            src="/logo.png"
            alt="VerifEye Logo"
            width={180}
            height={48}
            style={{ width: "auto", height: "42px", objectFit: "contain" }}
            priority
          />
        </div>

        <p style={{ fontSize: "14px", color: "#64748b", maxWidth: "520px", lineHeight: 1.5 }}>
          VerifEye is an AI-powered live news fact-checker that verifies breaking headlines, debunks viral misinformation, and checks claims against trustworthy sources.
        </p>
      </header>

      <main style={{ flex: 1, display: "flex", flexDirection: "column", width: "100%" }}>
        <Suspense fallback={null}>
          <ChatBox />
        </Suspense>
      </main>
    </div>
  );
}
