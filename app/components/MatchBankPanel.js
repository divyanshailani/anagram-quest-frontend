"use client";

/**
 * MatchBankPanel — Banking controls for Player vs AI mode.
 * Fast controls: boost current score or recover a missed word.
 */
export default function MatchBankPanel({
  humanBank,
  aiBank,
  bankFeed,
  currentLevel,
  canRecover,
  bankBusy,
  onBoost,
  onRecover,
}) {
  const unlocked = (currentLevel?.level || 0) >= 3;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.title}>🏦 SPEED BANK</span>
        <span style={styles.rule}>Unlocks at L3</span>
      </div>

      <div style={styles.counts}>
        <div style={styles.countCard}>
          <div style={styles.countLabel}>YOU</div>
          <div style={styles.countValue}>{humanBank}</div>
        </div>
        <div style={styles.countCard}>
          <div style={{ ...styles.countLabel, color: "var(--red)" }}>AI</div>
          <div style={{ ...styles.countValue, color: "var(--amber)" }}>{aiBank}</div>
        </div>
      </div>

      <div style={styles.actions}>
        <button
          onClick={onBoost}
          disabled={!unlocked || bankBusy || humanBank < 1}
          style={{
            ...styles.actionBtn,
            ...styles.boostBtn,
            opacity: !unlocked || bankBusy || humanBank < 1 ? 0.45 : 1,
          }}
        >
          Boost Current (+0.5)
        </button>
        <button
          onClick={onRecover}
          disabled={!unlocked || !canRecover || bankBusy || humanBank < 1}
          style={{
            ...styles.actionBtn,
            ...styles.recoverBtn,
            opacity: !unlocked || !canRecover || bankBusy || humanBank < 1 ? 0.45 : 1,
          }}
        >
          Recover Missed (+0.5 / -0.1)
        </button>
      </div>

      <div style={styles.feed}>
        <div style={styles.feedTitle}>Bank Activity</div>
        {bankFeed.length === 0 && (
          <div style={styles.empty}>No banking actions yet.</div>
        )}
        {bankFeed.slice(-5).map((event, idx) => (
          <div key={`${event.type}-${idx}`} style={styles.feedRow}>
            <span style={styles.feedActor}>{String(event.by || "system").toUpperCase()}</span>
            <span style={styles.feedText}>
              {event.type === "earn_preserve" && `Saved +1 bank (EV ${event.ev ?? "-"})`}
              {event.type === "spend_current" && `Boosted current (+0.5)`}
              {event.type === "recover" && `${event.success ? "Recovered" : "Recovery failed"} ${event.target_word || ""}`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: {
    marginTop: "10px",
    padding: "12px 14px",
    background: "linear-gradient(135deg, rgba(251, 191, 36, 0.08), rgba(6, 214, 160, 0.04))",
    border: "1px solid rgba(251, 191, 36, 0.24)",
    borderRadius: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontFamily: "var(--font-mono)",
    fontSize: "12px",
    fontWeight: 700,
    color: "var(--amber)",
    letterSpacing: "1.5px",
  },
  rule: {
    fontFamily: "var(--font-mono)",
    fontSize: "10px",
    color: "var(--text-dim)",
  },
  counts: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "8px",
  },
  countCard: {
    border: "1px solid rgba(148, 163, 184, 0.18)",
    borderRadius: "8px",
    padding: "8px 10px",
    background: "rgba(255,255,255,0.02)",
  },
  countLabel: {
    fontFamily: "var(--font-mono)",
    fontSize: "10px",
    color: "var(--cyan)",
    letterSpacing: "1px",
  },
  countValue: {
    fontFamily: "var(--font-mono)",
    fontSize: "20px",
    fontWeight: 800,
    color: "var(--cyan)",
    lineHeight: 1.2,
  },
  actions: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
  },
  actionBtn: {
    border: "none",
    borderRadius: "8px",
    padding: "8px 10px",
    cursor: "pointer",
    fontFamily: "var(--font-mono)",
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "0.4px",
  },
  boostBtn: {
    background: "linear-gradient(135deg, rgba(6, 214, 160, 0.9), rgba(5, 196, 148, 0.9))",
    color: "#041722",
  },
  recoverBtn: {
    background: "linear-gradient(135deg, rgba(251, 191, 36, 0.95), rgba(245, 158, 11, 0.95))",
    color: "#2b1700",
  },
  feed: {
    borderTop: "1px solid rgba(148, 163, 184, 0.12)",
    paddingTop: "8px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  feedTitle: {
    fontFamily: "var(--font-mono)",
    fontSize: "10px",
    color: "var(--text-dim)",
    letterSpacing: "1px",
    textTransform: "uppercase",
  },
  empty: {
    fontFamily: "var(--font-mono)",
    fontSize: "11px",
    color: "var(--text-dim)",
  },
  feedRow: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
  },
  feedActor: {
    fontFamily: "var(--font-mono)",
    fontSize: "10px",
    color: "var(--amber)",
    minWidth: "32px",
  },
  feedText: {
    fontFamily: "var(--font-mono)",
    fontSize: "11px",
    color: "var(--text-secondary)",
  },
};
