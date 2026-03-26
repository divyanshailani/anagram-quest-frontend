"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useMatchEngine } from "../hooks/useMatchEngine";
import { useSoundFX } from "../hooks/useSoundFX";
import PlayerArena from "../components/PlayerArena";
import AIArena from "../components/AIArena";

export default function VsPage() {
  const {
    matchId, status, currentLevel, timer,
    humanScore, humanFound, humanWrong,
    aiScore, aiFound, aiThinking,
    levelResults, matchResult, soundEvent, levelEndMeta,
    createMatch, submitGuess, stopMatch,
  } = useMatchEngine();

  const sfx = useSoundFX();
  const prevSoundRef = useRef(null);

  // Play sound events
  useEffect(() => {
    if (soundEvent && soundEvent !== prevSoundRef.current) {
      prevSoundRef.current = soundEvent;
      const fn = sfx[soundEvent.type];
      if (fn) fn();
    }
  }, [soundEvent, sfx]);

  // Timer color
  const timerColor = timer > 30 ? "var(--green)"
    : timer > 10 ? "var(--amber)" : "var(--red)";

  // Timer ring (SVG circular)
  const timerProgress = timer / 60;
  const circumference = 2 * Math.PI * 40;
  const dashOffset = circumference * (1 - timerProgress);

  return (
    <div style={styles.page}>
      {/* Header */}
      <header style={styles.header}>
        <Link href="/" style={styles.backLink}>← Back</Link>
        <h1 style={styles.title}>⚔️ PLAYER vs AI</h1>
        {currentLevel && (
          <span style={styles.levelBadge}>LEVEL {currentLevel.level}/5</span>
        )}
      </header>

      {status === "idle" && (
        <div style={styles.startScreen}>
          <h2 style={styles.heroText}>Challenge the AI</h2>
          <p style={styles.subText}>
            You and the AI get the same scrambled letters. Find as many words as you can in 60 seconds per level!
          </p>
          <button onClick={createMatch} style={styles.startBtn}>
            ⚔️ Start Match
          </button>
        </div>
      )}

      {(status === "playing" || status === "level_end") && currentLevel && (
        <>
          {/* Letters + Timer */}
          <div style={styles.topBar}>
            {/* Letter tiles */}
            <div style={styles.letterRow}>
              {currentLevel.letters.map((l, i) => (
                <span key={i} style={styles.letterTile}>{l}</span>
              ))}
            </div>

            {/* Timer */}
            <div style={styles.timerWrap}>
              <svg width="90" height="90" style={styles.timerSvg}>
                <circle cx="45" cy="45" r="40"
                  stroke="rgba(255,255,255,0.06)" strokeWidth="4" fill="none" />
                <circle cx="45" cy="45" r="40"
                  stroke={timerColor} strokeWidth="4" fill="none"
                  strokeDasharray={circumference} strokeDashoffset={dashOffset}
                  strokeLinecap="round"
                  style={{ transform: "rotate(-90deg)", transformOrigin: "center", transition: "stroke-dashoffset 1s linear" }}
                />
              </svg>
              <span style={{ ...styles.timerText, color: timerColor }}>
                {timer}
              </span>
            </div>

            {/* Word count */}
            <div style={styles.wordTarget}>
              You {humanFound.length}/{currentLevel.word_count} | AI {aiFound.length}/{currentLevel.word_count}
            </div>
          </div>

          {/* Split screen */}
          <div style={styles.splitContainer}>
            <PlayerArena
              onSubmitGuess={submitGuess}
              found={humanFound}
              wrong={humanWrong}
              score={humanScore}
              letters={currentLevel}
              disabled={status !== "playing"}
            />
            <div style={styles.divider}>
              <div style={styles.vsText}>VS</div>
            </div>
            <AIArena
              found={aiFound}
              thinking={aiThinking}
              score={aiScore}
            />
          </div>

          {/* Score ticker */}
          <div style={styles.scoreTicker}>
            <span style={{ color: "var(--cyan)" }}>You: {humanScore}</span>
            <span style={{ color: "var(--text-dim)" }}>|</span>
            <span style={{ color: "var(--red)" }}>AI: {aiScore}</span>
          </div>
        </>
      )}

      {/* Level end overlay */}
      {status === "level_end" && (
        <div style={styles.overlay}>
          <div style={styles.overlayCard}>
            <h3 style={styles.overlayTitle}>
              {levelEndMeta?.reason === "completed"
                ? levelEndMeta?.winner === "human"
                  ? "⚡ You Cleared The Level First!"
                  : levelEndMeta?.winner === "ai"
                    ? "⚡ AI Cleared The Level First!"
                    : "⚡ Level Cleared!"
                : "⏱️ Time's Up!"}
            </h3>
            <div style={styles.overlayScores}>
              <div>
                <div style={styles.overlayLabel}>YOU</div>
                <div style={styles.overlayValue}>{humanFound.length} words</div>
              </div>
              <div style={styles.overlayVs}>VS</div>
              <div>
                <div style={styles.overlayLabel}>AI</div>
                <div style={styles.overlayValue}>{aiFound.length} words</div>
              </div>
            </div>
            <p style={styles.overlayHint}>Next level starting...</p>
          </div>
        </div>
      )}

      {/* Match over overlay */}
      {status === "finished" && matchResult && (
        <div style={styles.overlay}>
          <div style={styles.overlayCard}>
            <h2 style={styles.matchOverTitle}>
              {matchResult.winner === "human" ? "🏆 YOU WIN!" :
               matchResult.winner === "ai" ? "🤖 AI WINS!" : "🤝 TIE GAME!"}
            </h2>

            <div style={styles.finalScores}>
              <div>
                <div style={styles.overlayLabel}>YOUR SCORE</div>
                <div style={{ ...styles.bigScore, color: "var(--cyan)" }}>
                  {matchResult.human_score}
                </div>
                <div style={styles.winsLabel}>{matchResult.human_levels_won} levels won</div>
              </div>
              <div>
                <div style={styles.overlayLabel}>AI SCORE</div>
                <div style={{ ...styles.bigScore, color: "var(--red)" }}>
                  {matchResult.ai_score}
                </div>
                <div style={styles.winsLabel}>{matchResult.ai_levels_won} levels won</div>
              </div>
            </div>

            {/* Level breakdown */}
            <div style={styles.levelBreakdown}>
              {matchResult.level_results?.map((r, i) => (
                <div key={i} style={styles.levelRow}>
                  <span style={styles.levelNum}>L{r.level}</span>
                  <span style={{ color: r.winner === "human" ? "var(--green)" :
                    r.winner === "ai" ? "var(--red)" : "var(--text-dim)" }}>
                    {r.human_count} - {r.ai_count}
                  </span>
                  <span style={styles.levelWinner}>
                    {r.winner === "human" ? "👤" : r.winner === "ai" ? "🤖" : "—"}
                  </span>
                </div>
              ))}
            </div>

            <div style={styles.overlayButtons}>
              <button onClick={createMatch} style={styles.startBtn}>
                ⚔️ Rematch
              </button>
              <Link href="/" style={styles.backBtn}>← Home</Link>
            </div>
          </div>
        </div>
      )}

      {status === "error" && (
        <div style={styles.startScreen}>
          <h2 style={{ ...styles.heroText, color: "var(--red)" }}>Connection Error</h2>
          <button onClick={createMatch} style={styles.startBtn}>Retry</button>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "var(--bg-deep)",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    position: "relative",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  backLink: {
    fontFamily: "var(--font-mono)",
    fontSize: "13px",
    color: "var(--text-dim)",
    textDecoration: "none",
  },
  title: {
    fontFamily: "var(--font-mono)",
    fontSize: "20px",
    fontWeight: 800,
    color: "var(--text-primary)",
    letterSpacing: "2px",
    flex: 1,
  },
  levelBadge: {
    fontFamily: "var(--font-mono)",
    fontSize: "12px",
    fontWeight: 700,
    color: "var(--amber)",
    background: "rgba(251, 191, 36, 0.1)",
    border: "1px solid rgba(251, 191, 36, 0.3)",
    padding: "4px 12px",
    borderRadius: "4px",
    letterSpacing: "2px",
  },

  // Start screen
  startScreen: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "16px",
  },
  heroText: {
    fontFamily: "var(--font-mono)",
    fontSize: "32px",
    fontWeight: 800,
    letterSpacing: "3px",
    color: "var(--text-primary)",
  },
  subText: {
    fontFamily: "var(--font-body)",
    fontSize: "15px",
    color: "var(--text-secondary)",
    textAlign: "center",
    maxWidth: "420px",
    lineHeight: 1.6,
  },
  startBtn: {
    fontFamily: "var(--font-mono)",
    fontSize: "16px",
    fontWeight: 700,
    padding: "14px 36px",
    background: "linear-gradient(135deg, #f43f5e, #ec4899)",
    color: "white",
    border: "none",
    borderRadius: "var(--radius-md)",
    cursor: "pointer",
    letterSpacing: "1px",
  },

  // Top bar
  topBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "24px",
  },
  letterRow: {
    display: "flex",
    gap: "8px",
  },
  letterTile: {
    width: "48px",
    height: "48px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "var(--font-mono)",
    fontSize: "22px",
    fontWeight: 800,
    color: "var(--text-primary)",
    background: "var(--bg-card)",
    border: "1px solid var(--border-glow)",
    borderRadius: "8px",
    letterSpacing: "1px",
  },
  timerWrap: {
    position: "relative",
    width: "90px",
    height: "90px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  timerSvg: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  timerText: {
    fontFamily: "var(--font-mono)",
    fontSize: "28px",
    fontWeight: 800,
  },
  wordTarget: {
    fontFamily: "var(--font-mono)",
    fontSize: "12px",
    color: "var(--text-dim)",
    letterSpacing: "1px",
  },

  // Split screen
  splitContainer: {
    display: "grid",
    gridTemplateColumns: "1fr auto 1fr",
    gap: "12px",
    flex: 1,
    minHeight: 0,
  },
  divider: {
    width: "2px",
    background: "linear-gradient(180deg, transparent, var(--border-glow), transparent)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  vsText: {
    fontFamily: "var(--font-mono)",
    fontSize: "12px",
    fontWeight: 800,
    color: "var(--amber)",
    background: "var(--bg-deep)",
    padding: "8px 4px",
    letterSpacing: "2px",
  },

  // Score ticker
  scoreTicker: {
    display: "flex",
    justifyContent: "center",
    gap: "16px",
    fontFamily: "var(--font-mono)",
    fontSize: "14px",
    fontWeight: 700,
    letterSpacing: "1px",
  },

  // Overlays
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(5, 10, 25, 0.85)",
    backdropFilter: "blur(8px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  overlayCard: {
    background: "var(--bg-card)",
    border: "1px solid var(--border-glow)",
    borderRadius: "var(--radius-lg)",
    padding: "32px",
    maxWidth: "440px",
    width: "90%",
    textAlign: "center",
  },
  overlayTitle: {
    fontFamily: "var(--font-mono)",
    fontSize: "24px",
    fontWeight: 800,
    color: "var(--amber)",
    marginBottom: "16px",
  },
  overlayScores: {
    display: "flex",
    justifyContent: "center",
    gap: "32px",
    alignItems: "center",
    marginBottom: "16px",
  },
  overlayLabel: {
    fontFamily: "var(--font-mono)",
    fontSize: "11px",
    color: "var(--text-dim)",
    letterSpacing: "2px",
    marginBottom: "4px",
  },
  overlayValue: {
    fontFamily: "var(--font-mono)",
    fontSize: "18px",
    fontWeight: 700,
    color: "var(--text-primary)",
  },
  overlayVs: {
    fontFamily: "var(--font-mono)",
    fontSize: "14px",
    color: "var(--text-dim)",
    fontWeight: 700,
  },
  overlayHint: {
    fontFamily: "var(--font-mono)",
    fontSize: "12px",
    color: "var(--text-dim)",
    marginTop: "12px",
  },
  matchOverTitle: {
    fontFamily: "var(--font-mono)",
    fontSize: "28px",
    fontWeight: 800,
    letterSpacing: "2px",
    marginBottom: "20px",
    color: "var(--text-primary)",
  },
  finalScores: {
    display: "flex",
    justifyContent: "center",
    gap: "48px",
    marginBottom: "20px",
  },
  bigScore: {
    fontFamily: "var(--font-mono)",
    fontSize: "36px",
    fontWeight: 900,
  },
  winsLabel: {
    fontFamily: "var(--font-mono)",
    fontSize: "11px",
    color: "var(--text-dim)",
    letterSpacing: "1px",
  },
  levelBreakdown: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    marginBottom: "20px",
  },
  levelRow: {
    display: "flex",
    justifyContent: "center",
    gap: "16px",
    fontFamily: "var(--font-mono)",
    fontSize: "13px",
  },
  levelNum: {
    color: "var(--text-dim)",
    width: "30px",
  },
  levelWinner: {
    width: "24px",
  },
  overlayButtons: {
    display: "flex",
    gap: "12px",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  backBtn: {
    fontFamily: "var(--font-mono)",
    fontSize: "14px",
    color: "var(--text-dim)",
    textDecoration: "none",
    padding: "12px 24px",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-md)",
  },
};
