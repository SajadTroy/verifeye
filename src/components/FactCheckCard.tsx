import React from "react";

export type FactStatus = "true" | "false" | "needs_context";

export interface FactCheckData {
  status: FactStatus;
  claim?: string;
}

interface FactCheckCardProps {
  data: FactCheckData;
}

export function FactCheckCard({ data }: FactCheckCardProps) {
  const { status, claim } = data;

  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        padding: "14px 16px",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        marginTop: "8px",
        width: "100%",
      }}
    >

      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        <div style={{ display: "flex", gap: "4px", width: "100%", height: "6px" }}>
          <div
            style={{
              flex: 1,
              borderRadius: "3px",
              background: status === "true" ? "#24b47e" : "#e5e7eb",
              transition: "background-color 0.2s",
            }}
          />
          <div
            style={{
              flex: 1,
              borderRadius: "3px",
              background: status === "needs_context" ? "#f59e0b" : "#e5e7eb",
              transition: "background-color 0.2s",
            }}
          />
          <div
            style={{
              flex: 1,
              borderRadius: "3px",
              background: status === "false" ? "#ef4444" : "#e5e7eb",
              transition: "background-color 0.2s",
            }}
          />
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#9ca3af", fontWeight: 500, padding: "0 2px" }}>
          <span style={{ color: status === "true" ? "#059669" : "#9ca3af", fontWeight: status === "true" ? 700 : 500 }}>
            True
          </span>
          <span style={{ color: status === "needs_context" ? "#b45309" : "#9ca3af", fontWeight: status === "needs_context" ? 700 : 500 }}>
            Needs Context
          </span>
          <span style={{ color: status === "false" ? "#dc2626" : "#9ca3af", fontWeight: status === "false" ? 700 : 500 }}>
            False
          </span>
        </div>
      </div>

      {claim && (
        <div style={{ fontSize: "13px", fontWeight: 600, color: "#111827" }}>
          Claim: &ldquo;{claim}&rdquo;
        </div>
      )}
    </div>
  );
}
