"use client";

import { useEffect } from "react";
import { useGameStream } from "./hooks/useGameStream";
import { useSoundFX } from "./hooks/useSoundFX";
import ThinkingBox from "./components/ThinkingBox";
import GameBoard from "./components/GameBoard";
import BankPanel from "./components/BankPanel";

export default function Home() {
  const {
    status, thinking, guesses, levels,
    currentLevel, score, bank, gameResult, bankDecisions,
    levelPause, soundEvent, startGame, stopGame, skipPause,
  } = useGameStream();

  const sfx = useSoundFX();

  // React to sound events from the game stream
  useEffect(() => {
    if (!soundEvent) return;
    const fn = sfx[soundEvent.type];
    if (fn) fn();
  }, [soundEvent, sfx]);

  return (
    <main style={styles.main}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <h1 style={styles.title}>
            <span style={styles.titleAccent}>ANAGRAM</span> QUEST
          </h1>
          <span style={styles.subtitle}>Watch AI Play</span>
        </div>

        <div style={styles.modeSwitch}>
          <a href="/vs" style={styles.vsLink}>⚔️ Player vs AI</a>
        </div>

        <div style={styles.headerCenter}>
          <span style={styles.techBadge}>Qwen3-0.6B GRPO</span>
          <span style={styles.techBadge}>MDP Banking</span>
          <span style={styles.techBadge}>SSE Stream</span>
        </div>

        <div style={styles.headerRight}>
          {status === "idle" || status === "finished" || status === "error" ? (
            <button onClick={startGame} style={styles.startBtn}>
              <span style={styles.btnIcon}>▶</span>
              {status === "finished" ? "Play Again" : "Start Game"}
            </button>
          ) : (
            <button onClick={stopGame} style={styles.stopBtn}>
              <span style={styles.btnIcon}>■</span>
              Stop
            </button>
          )}
        </div>
      </header>

      {/* Three-panel layout */}
      <div style={styles.grid}>
        {/* Left: AI Thinking terminal */}
        <div style={styles.panelLeft}>
          <ThinkingBox thinking={thinking} />
        </div>

        {/* Center: Game Board */}
        <div style={styles.panelCenter}>
          <GameBoard
            currentLevel={currentLevel}
            guesses={guesses}
            levels={levels}
            status={status}
            levelPause={levelPause}
            onSkipPause={skipPause}
          />
        </div>

        {/* Right: Score + Bank */}
        <div style={styles.panelRight}>
          <BankPanel
            score={score}
            bank={bank}
            bankDecisions={bankDecisions}
            gameResult={gameResult}
            status={status}
          />
        </div>
      </div>
    </main>
  );
}

const styles = {
  main: {
    position: "relative",
    zIndex: 1,
    minHeight: "100vh",
    padding: "16px 20px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    maxWidth: "1600px",
    margin: "0 auto",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 20px",
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-lg)",
    backdropFilter: "blur(12px)",
  },
  headerLeft: {
    display: "flex",
    alignItems: "baseline",
    gap: "12px",
  },
  title: {
    fontFamily: "var(--font-mono)",
    fontSize: "20px",
    fontWeight: 800,
    color: "var(--text-primary)",
    letterSpacing: "2px",
  },
  titleAccent: {
    background: "linear-gradient(135deg, var(--cyan), var(--purple))",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  subtitle: {
    fontFamily: "var(--font-mono)",
    fontSize: "12px",
    color: "var(--text-dim)",
    letterSpacing: "1px",
  },
  headerCenter: {
    display: "flex",
    gap: "8px",
  },
  techBadge: {
    fontFamily: "var(--font-mono)",
    fontSize: "10px",
    color: "var(--text-dim)",
    padding: "3px 10px",
    borderRadius: "20px",
    background: "rgba(255,255,255,0.03)",
    border: "1px solid var(--border)",
    letterSpacing: "0.5px",
  },
  headerRight: {},
  startBtn: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 24px",
    background: "linear-gradient(135deg, var(--cyan), #05c494)",
    color: "#0a0e1a",
    border: "none",
    borderRadius: "var(--radius-md)",
    fontFamily: "var(--font-mono)",
    fontSize: "13px",
    fontWeight: 700,
    cursor: "pointer",
    letterSpacing: "1px",
    transition: "all 0.2s",
    boxShadow: "0 4px 15px rgba(6, 214, 160, 0.3)",
  },
  stopBtn: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 24px",
    background: "transparent",
    color: "var(--red)",
    border: "1px solid var(--red)",
    borderRadius: "var(--radius-md)",
    fontFamily: "var(--font-mono)",
    fontSize: "13px",
    fontWeight: 700,
    cursor: "pointer",
    letterSpacing: "1px",
  },
  btnIcon: {
    fontSize: "10px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1.4fr 0.8fr",
    gap: "16px",
    flex: 1,
    minHeight: 0,
    height: "calc(100vh - 100px)",
  },
  panelLeft: {
    minHeight: 0,
    overflow: "hidden",
  },
  panelCenter: {
    minHeight: 0,
    overflow: "hidden",
  },
  panelRight: {
    minHeight: 0,
    overflow: "hidden",
  },
  modeSwitch: {
    display: "flex",
    alignItems: "center",
  },
  vsLink: {
    fontFamily: "var(--font-mono)",
    fontSize: "13px",
    fontWeight: 700,
    color: "#f43f5e",
    textDecoration: "none",
    padding: "8px 16px",
    border: "1px solid rgba(244, 63, 94, 0.3)",
    borderRadius: "var(--radius-md)",
    background: "rgba(244, 63, 94, 0.08)",
    letterSpacing: "1px",
    transition: "all 0.2s",
  },
};
