"use client";

/**
 * GameBoard — Central panel showing letters, guesses, level progress,
 * and a Level Complete overlay with countdown between levels.
 */
export default function GameBoard({ currentLevel, guesses, levels, status, levelPause, onSkipPause }) {
  return (
    <div style={styles.container}>
      {/* Level Complete Overlay */}
      {levelPause?.active && levelPause.levelData && (
        <div style={styles.overlay}>
          <div style={styles.overlayCard}>
            {/* Countdown ring */}
            <div style={styles.countdownRing}>
              <svg width="80" height="80" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="35" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
                <circle
                  cx="40" cy="40" r="35"
                  fill="none"
                  stroke="var(--cyan)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 35}`}
                  strokeDashoffset={`${2 * Math.PI * 35 * (1 - levelPause.countdown / 10)}`}
                  transform="rotate(-90 40 40)"
                  style={{ transition: "stroke-dashoffset 1s linear" }}
                />
              </svg>
              <span style={styles.countdownNum}>{levelPause.countdown}</span>
            </div>

            <div style={styles.overlayTitle}>
              Level {levelPause.levelData.level} Complete
            </div>

            {/* Found words */}
            {levelPause.levelData.found?.length > 0 && (
              <div style={styles.wordSection}>
                <div style={styles.wordLabel}>✅ Found</div>
                <div style={styles.wordList}>
                  {levelPause.levelData.found.map((w, i) => (
                    <span key={i} style={styles.wordTagGreen}>{w}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Missed words */}
            {levelPause.levelData.missed?.length > 0 && (
              <div style={styles.wordSection}>
                <div style={styles.wordLabel}>❌ Missed</div>
                <div style={styles.wordList}>
                  {levelPause.levelData.missed.map((w, i) => (
                    <span key={i} style={styles.wordTagRed}>{w}</span>
                  ))}
                </div>
              </div>
            )}

            {levelPause.levelData.all_found && (
              <div style={styles.perfectBadge}>⭐ Perfect Level!</div>
            )}

            <button onClick={onSkipPause} style={styles.skipBtn}>
              Skip →
            </button>
          </div>
        </div>
      )}

      {/* Level indicator */}
      {currentLevel && (
        <div className="animate-in" style={styles.levelBadge}>
          LEVEL {currentLevel.level}
          <span style={styles.wordCount}>
            {currentLevel.word_count} words to find
          </span>
        </div>
      )}

      {/* Letter tiles */}
      {currentLevel && (
        <div style={styles.lettersRow}>
          {currentLevel.letters.map((l, i) => (
            <div
              key={`${currentLevel.level}-${i}`}
              className="animate-in"
              style={{
                ...styles.letterTile,
                animationDelay: `${i * 0.1}s`,
                animation: `letter-pop 0.5s ease-out ${i * 0.1}s both`,
              }}
            >
              {l}
            </div>
          ))}
        </div>
      )}

      {/* Guesses stream */}
      <div style={styles.guessGrid}>
        {guesses.map((g, i) => (
          <div
            key={i}
            className="animate-in"
            style={{
              ...styles.guessCard,
              borderColor: g.correct ? "var(--green)" : "var(--red)",
              background: g.correct
                ? "rgba(52, 211, 153, 0.08)"
                : "rgba(248, 113, 113, 0.08)",
            }}
          >
            <span style={styles.guessWord}>{g.word}</span>
            <span style={{
              ...styles.rewardBadge,
              color: g.correct ? "var(--green)" : "var(--red)",
            }}>
              {g.correct
                ? `+${g.reward}${g.first_try ? " 🎯" : ""}`
                : "✗"
              }
            </span>
          </div>
        ))}
      </div>

      {/* Level history */}
      {levels.length > 0 && (
        <div style={styles.history}>
          <div style={styles.historyTitle}>Level History</div>
          <div style={styles.historyGrid}>
            {levels.map((l, i) => (
              <div key={i} style={styles.historyItem}>
                <span style={styles.historyLevel}>L{l.level}</span>
                <div style={styles.progressBar}>
                  <div
                    style={{
                      ...styles.progressFill,
                      width: `${(l.found.length / (l.found.length + l.missed.length)) * 100}%`,
                    }}
                  />
                </div>
                <span style={styles.historyScore}>
                  {l.found.length}/{l.found.length + l.missed.length}
                  {l.all_found && " ⭐"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Idle state */}
      {status === "idle" && (
        <div style={styles.idle}>
          <div style={styles.idleIcon}>🧠</div>
          <div style={styles.idleText}>
            Press <strong>Start Game</strong> to watch the AI play
          </div>
          <div style={styles.idleSubtext}>
            GRPO-trained Qwen3 + MDP Banking Engine
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    position: "relative",
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-lg)",
    backdropFilter: "blur(12px)",
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    height: "100%",
    overflow: "auto",
  },
  // ─── Overlay ───
  overlay: {
    position: "absolute",
    inset: 0,
    zIndex: 50,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(10, 14, 26, 0.85)",
    backdropFilter: "blur(8px)",
    borderRadius: "var(--radius-lg)",
    animation: "fadeIn 0.3s ease-out",
  },
  overlayCard: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "16px",
    padding: "32px 40px",
    background: "rgba(255, 255, 255, 0.03)",
    border: "1px solid var(--border-glow)",
    borderRadius: "var(--radius-lg)",
    maxWidth: "400px",
    width: "90%",
  },
  countdownRing: {
    position: "relative",
    width: "80px",
    height: "80px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  countdownNum: {
    position: "absolute",
    fontFamily: "var(--font-mono)",
    fontSize: "28px",
    fontWeight: 700,
    color: "var(--cyan)",
    textShadow: "0 0 20px var(--cyan-glow)",
  },
  overlayTitle: {
    fontFamily: "var(--font-mono)",
    fontSize: "18px",
    fontWeight: 700,
    color: "var(--text-primary)",
    letterSpacing: "2px",
    textTransform: "uppercase",
  },
  wordSection: {
    width: "100%",
  },
  wordLabel: {
    fontFamily: "var(--font-mono)",
    fontSize: "11px",
    color: "var(--text-dim)",
    marginBottom: "6px",
    letterSpacing: "1px",
  },
  wordList: {
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
  },
  wordTagGreen: {
    fontFamily: "var(--font-mono)",
    fontSize: "12px",
    padding: "3px 10px",
    borderRadius: "4px",
    background: "rgba(52, 211, 153, 0.12)",
    border: "1px solid rgba(52, 211, 153, 0.3)",
    color: "var(--green)",
  },
  wordTagRed: {
    fontFamily: "var(--font-mono)",
    fontSize: "12px",
    padding: "3px 10px",
    borderRadius: "4px",
    background: "rgba(248, 113, 113, 0.12)",
    border: "1px solid rgba(248, 113, 113, 0.3)",
    color: "var(--red)",
  },
  perfectBadge: {
    fontFamily: "var(--font-mono)",
    fontSize: "14px",
    color: "var(--amber)",
    padding: "6px 16px",
    borderRadius: "20px",
    background: "rgba(251, 191, 36, 0.1)",
    border: "1px solid rgba(251, 191, 36, 0.3)",
    letterSpacing: "1px",
  },
  skipBtn: {
    marginTop: "8px",
    padding: "8px 24px",
    background: "transparent",
    color: "var(--text-dim)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-md)",
    fontFamily: "var(--font-mono)",
    fontSize: "12px",
    cursor: "pointer",
    transition: "all 0.2s",
    letterSpacing: "1px",
  },
  // ─── Normal layout ───
  levelBadge: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    fontFamily: "var(--font-mono)",
    fontSize: "14px",
    fontWeight: 700,
    color: "var(--cyan)",
    letterSpacing: "2px",
  },
  wordCount: {
    fontSize: "12px",
    color: "var(--text-dim)",
    fontWeight: 400,
    letterSpacing: 0,
  },
  lettersRow: {
    display: "flex",
    gap: "10px",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  letterTile: {
    width: "56px",
    height: "56px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, rgba(6, 214, 160, 0.15), rgba(167, 139, 250, 0.1))",
    border: "1px solid var(--border-glow)",
    borderRadius: "var(--radius-md)",
    fontFamily: "var(--font-mono)",
    fontSize: "24px",
    fontWeight: 700,
    color: "var(--text-primary)",
    textShadow: "0 0 10px var(--cyan-glow)",
  },
  guessGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
  },
  guessCard: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 14px",
    borderRadius: "var(--radius-sm)",
    border: "1px solid",
    transition: "all 0.2s",
  },
  guessWord: {
    fontFamily: "var(--font-mono)",
    fontSize: "15px",
    fontWeight: 600,
    color: "var(--text-primary)",
  },
  rewardBadge: {
    fontFamily: "var(--font-mono)",
    fontSize: "12px",
    fontWeight: 500,
  },
  history: {
    marginTop: "auto",
    borderTop: "1px solid var(--border)",
    paddingTop: "16px",
  },
  historyTitle: {
    fontSize: "11px",
    color: "var(--text-dim)",
    textTransform: "uppercase",
    letterSpacing: "1px",
    marginBottom: "8px",
  },
  historyGrid: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  historyItem: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  historyLevel: {
    fontFamily: "var(--font-mono)",
    fontSize: "12px",
    color: "var(--text-secondary)",
    width: "24px",
  },
  progressBar: {
    flex: 1,
    height: "6px",
    background: "rgba(255,255,255,0.05)",
    borderRadius: "3px",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    background: "linear-gradient(90deg, var(--cyan), var(--purple))",
    borderRadius: "3px",
    transition: "width 0.5s ease",
  },
  historyScore: {
    fontFamily: "var(--font-mono)",
    fontSize: "12px",
    color: "var(--text-secondary)",
    width: "50px",
    textAlign: "right",
  },
  idle: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    flex: 1,
    opacity: 0.7,
  },
  idleIcon: {
    fontSize: "48px",
  },
  idleText: {
    fontFamily: "var(--font-sans)",
    fontSize: "16px",
    color: "var(--text-secondary)",
  },
  idleSubtext: {
    fontFamily: "var(--font-mono)",
    fontSize: "12px",
    color: "var(--text-dim)",
  },
};
