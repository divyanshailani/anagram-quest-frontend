"use client";

import { useEffect, useRef } from "react";

/**
 * ThinkingBox — AI Terminal Monologue
 * Displays streamed thinking events like a hacker terminal.
 */
export default function ThinkingBox({ thinking }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thinking]);

  const getColor = (phase) => {
    switch (phase) {
      case "analyze": return "var(--cyan)";
      case "solve": return "var(--purple)";
      case "result": return "var(--green)";
      case "banking": return "var(--amber)";
      case "recovery": return "var(--hot-pink)";
      case "error": return "var(--red)";
      case "level": return "var(--cyan)";
      default: return "var(--text-secondary)";
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.dot} />
        <span style={styles.dot2} />
        <span style={styles.dot3} />
        <span style={styles.title}>AI_THINKING.log</span>
      </div>
      <div style={styles.terminal}>
        {thinking.length === 0 && (
          <div style={styles.idle}>
            <span style={styles.cursor}>▌</span> Waiting for game start...
          </div>
        )}
        {thinking.map((t, i) => (
          <div
            key={i}
            className="animate-slide"
            style={{
              ...styles.line,
              animationDelay: `${i * 0.02}s`,
            }}
          >
            <span style={{ color: "var(--text-dim)", fontFamily: "var(--font-mono)", fontSize: "11px" }}>
              {new Date(t.ts).toLocaleTimeString("en", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
            <span style={{ color: getColor(t.phase), fontFamily: "var(--font-mono)", fontSize: "13px" }}>
              {" "}{t.text}
            </span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

const styles = {
  container: {
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-lg)",
    overflow: "hidden",
    backdropFilter: "blur(12px)",
    height: "100%",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "10px 14px",
    background: "rgba(0,0,0,0.3)",
    borderBottom: "1px solid var(--border)",
  },
  dot: {
    width: "10px", height: "10px", borderRadius: "50%",
    background: "#f87171",
  },
  dot2: {
    width: "10px", height: "10px", borderRadius: "50%",
    background: "#fbbf24",
  },
  dot3: {
    width: "10px", height: "10px", borderRadius: "50%",
    background: "#34d399",
  },
  title: {
    fontFamily: "var(--font-mono)",
    fontSize: "12px",
    color: "var(--text-dim)",
    marginLeft: "8px",
  },
  terminal: {
    flex: 1,
    overflow: "auto",
    padding: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  idle: {
    color: "var(--text-dim)",
    fontFamily: "var(--font-mono)",
    fontSize: "13px",
  },
  cursor: {
    color: "var(--cyan)",
    animation: "typing-cursor 1s infinite",
  },
  line: {
    display: "flex",
    gap: "8px",
    lineHeight: 1.6,
  },
};
