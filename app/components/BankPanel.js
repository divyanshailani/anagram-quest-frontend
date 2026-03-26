"use client";

/**
 * BankPanel — Score + Banking decisions display
 */
export default function BankPanel({ score, bank, bankDecisions, gameResult, status }) {
  return (
    <div style={styles.container}>
      {/* Score display */}
      <div style={styles.scoreBox}>
        <div style={styles.scoreLabel}>TOTAL REWARD</div>
        <div
          style={styles.scoreValue}
          key={score}
        >
          {score.toFixed(1)}
        </div>
        <div style={styles.scoreSubtext}>points</div>
      </div>

      {/* Bank display */}
      <div style={styles.bankBox}>
        <div style={styles.bankHeader}>
          <span style={styles.bankIcon}>🏦</span>
          <span style={styles.bankLabel}>BANK</span>
        </div>
        <div style={styles.bankValue}>{bank}</div>
        <div style={styles.bankChips}>
          {Array.from({ length: Math.max(bank, 0) }).map((_, i) => (
            <div key={i} style={styles.chip} />
          ))}
          {bank === 0 && (
            <span style={styles.emptyBank}>empty</span>
          )}
        </div>
      </div>

      {/* Banking decisions log */}
      {bankDecisions.length > 0 && (
        <div style={styles.decisionsBox}>
          <div style={styles.decisionsTitle}>MDP Decisions</div>
          {bankDecisions.map((d, i) => (
            <div key={i} className="animate-in" style={styles.decisionItem}>
              <span style={{
                ...styles.decisionBadge,
                background: d.action === "earn_preserve"
                  ? "var(--cyan-dim)"
                  : "var(--amber-dim)",
                color: d.action === "earn_preserve"
                  ? "var(--cyan)"
                  : "var(--amber)",
              }}>
                {d.action === "earn_preserve" ? "PRESERVE" : "CURRENT"}
              </span>
              <span style={styles.decisionEv}>
                EV: {d.ev}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Game result */}
      {gameResult && (
        <div style={styles.resultBox}>
          <div style={styles.resultTitle}>
            {gameResult.perfect_game ? "🏆 PERFECT GAME!" : "🏁 GAME OVER"}
          </div>
          <div style={styles.resultGrid}>
            <div style={styles.resultStat}>
              <span style={styles.resultStatLabel}>Accuracy</span>
              <span style={styles.resultStatValue}>{gameResult.accuracy}%</span>
            </div>
            <div style={styles.resultStat}>
              <span style={styles.resultStatLabel}>Words</span>
              <span style={styles.resultStatValue}>
                {gameResult.total_correct}/{gameResult.total_possible}
              </span>
            </div>
            <div style={styles.resultStat}>
              <span style={styles.resultStatLabel}>Reward</span>
              <span style={{
                ...styles.resultStatValue,
                color: "var(--cyan)",
              }}>
                {gameResult.total_reward.toFixed(1)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Status indicator */}
      <div style={styles.statusBar}>
        <div style={{
          ...styles.statusDot,
          background: status === "playing" ? "var(--green)"
            : status === "finished" ? "var(--cyan)"
              : status === "error" ? "var(--red)"
                : "var(--text-dim)",
          boxShadow: status === "playing"
            ? "0 0 8px var(--green)"
            : "none",
        }} />
        <span style={styles.statusText}>
          {status === "playing" ? "LIVE" : status.toUpperCase()}
        </span>
      </div>
    </div>
  );
}

const styles = {
  container: {
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-lg)",
    backdropFilter: "blur(12px)",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    height: "100%",
    overflow: "auto",
  },
  scoreBox: {
    textAlign: "center",
    padding: "20px",
    background: "linear-gradient(135deg, rgba(6, 214, 160, 0.08), rgba(167, 139, 250, 0.05))",
    borderRadius: "var(--radius-md)",
    border: "1px solid var(--border)",
  },
  scoreLabel: {
    fontFamily: "var(--font-mono)",
    fontSize: "10px",
    color: "var(--text-dim)",
    letterSpacing: "2px",
    marginBottom: "4px",
  },
  scoreValue: {
    fontFamily: "var(--font-mono)",
    fontSize: "42px",
    fontWeight: 700,
    color: "var(--cyan)",
    lineHeight: 1,
    textShadow: "0 0 20px var(--cyan-glow)",
  },
  scoreSubtext: {
    fontFamily: "var(--font-mono)",
    fontSize: "11px",
    color: "var(--text-dim)",
    marginTop: "4px",
  },
  bankBox: {
    padding: "16px",
    background: "rgba(251, 191, 36, 0.05)",
    borderRadius: "var(--radius-md)",
    border: "1px solid rgba(251, 191, 36, 0.15)",
  },
  bankHeader: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    marginBottom: "8px",
  },
  bankIcon: { fontSize: "16px" },
  bankLabel: {
    fontFamily: "var(--font-mono)",
    fontSize: "11px",
    color: "var(--amber)",
    letterSpacing: "2px",
  },
  bankValue: {
    fontFamily: "var(--font-mono)",
    fontSize: "32px",
    fontWeight: 700,
    color: "var(--amber)",
    textAlign: "center",
    marginBottom: "8px",
  },
  bankChips: {
    display: "flex",
    gap: "4px",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  chip: {
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, var(--amber), #f59e0b)",
    border: "2px solid rgba(251, 191, 36, 0.4)",
  },
  emptyBank: {
    fontFamily: "var(--font-mono)",
    fontSize: "11px",
    color: "var(--text-dim)",
  },
  decisionsBox: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  decisionsTitle: {
    fontFamily: "var(--font-mono)",
    fontSize: "10px",
    color: "var(--text-dim)",
    letterSpacing: "1px",
    textTransform: "uppercase",
  },
  decisionItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "6px 10px",
    borderRadius: "var(--radius-sm)",
    background: "rgba(255,255,255,0.02)",
  },
  decisionBadge: {
    fontFamily: "var(--font-mono)",
    fontSize: "10px",
    fontWeight: 600,
    padding: "2px 8px",
    borderRadius: "4px",
    letterSpacing: "1px",
  },
  decisionEv: {
    fontFamily: "var(--font-mono)",
    fontSize: "11px",
    color: "var(--text-dim)",
  },
  resultBox: {
    padding: "16px",
    background: "linear-gradient(135deg, rgba(6, 214, 160, 0.1), rgba(167, 139, 250, 0.08))",
    borderRadius: "var(--radius-md)",
    border: "1px solid var(--border-glow)",
    animation: "pulse-glow 2s infinite",
  },
  resultTitle: {
    fontFamily: "var(--font-mono)",
    fontSize: "16px",
    fontWeight: 700,
    color: "var(--cyan)",
    textAlign: "center",
    marginBottom: "12px",
  },
  resultGrid: {
    display: "flex",
    justifyContent: "space-around",
  },
  resultStat: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "2px",
  },
  resultStatLabel: {
    fontFamily: "var(--font-mono)",
    fontSize: "10px",
    color: "var(--text-dim)",
    textTransform: "uppercase",
    letterSpacing: "1px",
  },
  resultStatValue: {
    fontFamily: "var(--font-mono)",
    fontSize: "20px",
    fontWeight: 700,
    color: "var(--text-primary)",
  },
  statusBar: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    marginTop: "auto",
    padding: "8px 0",
  },
  statusDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    transition: "all 0.3s",
  },
  statusText: {
    fontFamily: "var(--font-mono)",
    fontSize: "11px",
    color: "var(--text-dim)",
    letterSpacing: "1px",
  },
};
