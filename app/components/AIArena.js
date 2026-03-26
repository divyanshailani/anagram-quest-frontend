"use client";

import { useRef, useEffect } from "react";

/**
 * AIArena — AI's side in Player vs AI mode
 * Shows AI thinking log + drip-fed found words + score
 */
export default function AIArena({ found, thinking, score }) {
  const logRef = useRef(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [thinking, found]);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.label}>🤖 AI</span>
        <span style={styles.score}>{score}</span>
      </div>

      {/* AI Thinking Terminal */}
      <div ref={logRef} style={styles.terminal}>
        {thinking.map((entry, i) => (
          <div key={`t-${i}`} style={styles.logLine}>
            <span style={{ color: "var(--text-dim)" }}>{entry.text}</span>
          </div>
        ))}
        {found.map((g, i) => (
          <div key={`f-${i}`} style={styles.logLine}>
            <span style={{ color: "var(--green)" }}>
              ✓ {g.word}
            </span>
            <span style={styles.rewardBadge}>+{g.reward}</span>
          </div>
        ))}
        <div style={styles.cursor}>█</div>
      </div>

      {/* Found word pills */}
      <div style={styles.wordList}>
        {found.map((g, i) => (
          <span key={i} style={styles.wordTag}>
            {g.word}
          </span>
        ))}
      </div>

      <div style={styles.stats}>
        {found.length} found by AI
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
    gap: "12px",
    height: "100%",
    overflow: "auto",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    fontFamily: "var(--font-mono)",
    fontSize: "14px",
    fontWeight: 700,
    color: "var(--red)",
    letterSpacing: "2px",
  },
  score: {
    fontFamily: "var(--font-mono)",
    fontSize: "28px",
    fontWeight: 800,
    color: "var(--amber)",
  },
  terminal: {
    flex: 1,
    background: "rgba(0, 0, 0, 0.4)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "var(--radius-md)",
    padding: "12px",
    fontFamily: "var(--font-mono)",
    fontSize: "12px",
    lineHeight: 1.6,
    overflowY: "auto",
    maxHeight: "200px",
    minHeight: "120px",
  },
  logLine: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rewardBadge: {
    fontSize: "10px",
    color: "var(--amber)",
    fontWeight: 600,
  },
  cursor: {
    color: "var(--cyan)",
    animation: "blink 1s step-start infinite",
  },
  wordList: {
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
  },
  wordTag: {
    fontFamily: "var(--font-mono)",
    fontSize: "13px",
    padding: "4px 12px",
    borderRadius: "4px",
    background: "rgba(248, 113, 113, 0.12)",
    border: "1px solid rgba(248, 113, 113, 0.3)",
    color: "var(--red)",
  },
  stats: {
    marginTop: "auto",
    fontFamily: "var(--font-mono)",
    fontSize: "11px",
    color: "var(--text-dim)",
    letterSpacing: "1px",
  },
};
