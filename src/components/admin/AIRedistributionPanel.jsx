import { useState } from "react";
import { ArrowRightLeft, BrainCircuit, Loader2, AlertTriangle, CheckCircle2, ArrowRight, Megaphone } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

export default function AIRedistributionPanel() {
  const [plan, setPlan]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const generatePlan = async () => {
    setLoading(true);
    setError(null);
    setPlan(null);

    try {
      const res  = await fetch(`${API_URL}/admin/predictions/redistribution`, { method: "POST" });
      const data = await res.json();

      if (data.success) {
        setPlan(data.data);
      } else {
        setError(data.error || "Failed to generate plan.");
      }
    } catch {
      setError("Could not reach the AI service. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const urgencyColor = {
    HIGH:   { bg: "#fff1f2", border: "#fecdd3", badge: "#e11d48", text: "#9f1239" },
    MEDIUM: { bg: "#fffbeb", border: "#fde68a", badge: "#d97706", text: "#92400e" },
    LOW:    { bg: "#f0fdf4", border: "#bbf7d0", badge: "#16a34a", text: "#166534" },
  };
  const colors = urgencyColor[plan?.urgencyLevel] || urgencyColor.LOW;

  return (
    <div style={{ marginBottom: "32px" }}>

      {/* ── Header row ─────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
        <ArrowRightLeft size={24} color="#7c3aed" />
        <h3 style={{ margin: 0, fontSize: "1.25rem", color: "#1e293b", fontWeight: "bold" }}>
          AI Redistribution Engine
        </h3>

        <button
          onClick={generatePlan}
          disabled={loading}
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: loading ? "#e9d5ff" : "#7c3aed",
            color: "white",
            border: "none",
            padding: "10px 20px",
            borderRadius: "8px",
            fontWeight: "bold",
            fontSize: "0.9rem",
            cursor: loading ? "not-allowed" : "pointer",
            transition: "background 0.2s"
          }}
        >
          {loading
            ? <><Loader2 size={16} className="admin-refresh-spin" /> Analyzing Centers…</>
            : <><BrainCircuit size={16} /> Ask AI for Redistribution Plan</>}
        </button>
      </div>

      {/* ── Idle state ─────────────────────────────── */}
      {!plan && !loading && !error && (
        <div style={{
          background: "#f5f3ff",
          border: "1px dashed #c4b5fd",
          borderRadius: "12px",
          padding: "32px",
          textAlign: "center",
          color: "#7c3aed"
        }}>
          <ArrowRightLeft size={36} style={{ opacity: 0.4, marginBottom: "12px" }} />
          <p style={{ margin: 0, fontWeight: "500" }}>
            Press <strong>"Ask AI"</strong> above to generate a real-time grain redistribution plan from your live center data.
          </p>
        </div>
      )}

      {/* ── Error ──────────────────────────────────── */}
      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fee2e2", borderRadius: "12px", padding: "16px", display: "flex", gap: "10px", alignItems: "center", color: "#b91c1c" }}>
          <AlertTriangle size={20} /> {error}
        </div>
      )}

      {/* ── Result ─────────────────────────────────── */}
      {plan && (
        <div style={{ background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: "12px", overflow: "hidden" }}>

          {/* Top bar */}
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${colors.border}`, display: "flex", alignItems: "center", gap: "12px" }}>
            <BrainCircuit size={22} color={colors.badge} />
            <span style={{ fontWeight: "bold", color: colors.text, flex: 1 }}>{plan.summary}</span>
            <span style={{ background: colors.badge, color: "white", padding: "4px 12px", borderRadius: "999px", fontSize: "0.8rem", fontWeight: "bold" }}>
              {plan.urgencyLevel} URGENCY
            </span>
          </div>

          <div style={{ padding: "20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>

            {/* Surplus */}
            <div>
              <h4 style={{ margin: "0 0 10px", color: "#0f172a", fontSize: "0.875rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                🟢 Surplus Centers
              </h4>
              {plan.surplusCenters.length === 0
                ? <p style={{ color: "#64748b", margin: 0 }}>None</p>
                : plan.surplusCenters.map((c, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px", color: "#16a34a", marginBottom: "6px" }}>
                    <CheckCircle2 size={14} /> {c}
                  </div>
                ))}
            </div>

            {/* Deficit */}
            <div>
              <h4 style={{ margin: "0 0 10px", color: "#0f172a", fontSize: "0.875rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                🔴 Deficit Centers
              </h4>
              {plan.deficitCenters.length === 0
                ? <p style={{ color: "#64748b", margin: 0 }}>None</p>
                : plan.deficitCenters.map((c, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px", color: "#e11d48", marginBottom: "6px" }}>
                    <AlertTriangle size={14} /> {c}
                  </div>
                ))}
            </div>
          </div>

          {/* Transfer Plan */}
          {plan.transferPlan?.length > 0 && (
            <div style={{ padding: "0 20px 20px" }}>
              <h4 style={{ margin: "0 0 12px", color: "#0f172a", fontSize: "0.875rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                📦 Transfer Plan
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {plan.transferPlan.map((t, i) => (
                  <div key={i} style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "14px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px", flexWrap: "wrap" }}>
                      <strong style={{ color: "#16a34a" }}>{t.from}</strong>
                      <ArrowRight size={16} color="#64748b" />
                      <strong style={{ color: "#e11d48" }}>{t.to}</strong>
                      <span style={{ marginLeft: "auto", background: "#f1f5f9", padding: "2px 10px", borderRadius: "999px", fontSize: "0.8rem", color: "#475569", fontWeight: "600" }}>
                        {t.quantityTonnes} Tonnes
                      </span>
                      <span style={{ background: "#fef9c3", padding: "2px 10px", borderRadius: "999px", fontSize: "0.8rem", color: "#a16207", fontWeight: "600" }}>
                        {t.deadline}
                      </span>
                    </div>
                    <p style={{ margin: 0, color: "#64748b", fontSize: "0.875rem" }}>{t.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ministry Note */}
          {plan.ministryNote && (
            <div style={{ margin: "0 20px 20px", background: colors.badge, borderRadius: "10px", padding: "14px 16px", display: "flex", gap: "10px", alignItems: "flex-start" }}>
              <Megaphone size={18} color="white" style={{ flexShrink: 0, marginTop: "2px" }} />
              <p style={{ margin: 0, color: "white", fontWeight: "600", fontSize: "0.95rem" }}>
                Ministry Directive: {plan.ministryNote}
              </p>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
