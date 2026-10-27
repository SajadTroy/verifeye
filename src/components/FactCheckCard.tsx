import React from "react";
import { CheckCircle2, AlertCircle, XCircle } from "lucide-react";

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

  const statusConfig = {
    true: {
      label: "True",
      color: "#059669",
      bg: "#ecfdf5",
      border: "#a7f3d0",
      activeColor: "#24b47e",
      icon: <CheckCircle2 size={14} strokeWidth={2.2} />,
    },
    needs_context: {
      label: "Needs Context",
      color: "#b45309",
      bg: "#fffbeb",
      border: "#fde68a",
      activeColor: "#f59e0b",
      icon: <AlertCircle size={14} strokeWidth={2.2} />,
    },
    false: {
      label: "False",
      color: "#dc2626",
      bg: "#fef2f2",
      border: "#fecaca",
      activeColor: "#ef4444",
      icon: <XCircle size={14} strokeWidth={2.2} />,
    },
  }[status];

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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
        <span style={{ fontSize: "11px", fontWeight: 700, color: "#6b7280", letterSpacing: "0.05em", textTransform: "uppercase" }}>
          Fact Check Assessment
        </span>

        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            background: statusConfig.bg,
            color: statusConfig.color,
            border: `1px solid ${statusConfig.border}`,
            borderRadius: "6px",
            padding: "3px 8px",
            fontSize: "12px",
            fontWeight: 600,
          }}
        >
          {statusConfig.icon}
          <span>{statusConfig.label}</span>
        </span>
      </div>

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
