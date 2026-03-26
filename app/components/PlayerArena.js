"use client";

import { useState, useRef, useEffect } from "react";

/**
 * PlayerArena — Human player's side in Player vs AI mode
 */
export default function PlayerArena({ onSubmitGuess, found, wrong, score, letters, disabled }) {
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState(null); // { type, message }
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!disabled && inputRef.current) inputRef.current.focus();
  }, [disabled, found]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting || disabled) return;

    // Read directly from the input DOM node to avoid missing the last keystroke
    // when Enter is pressed very quickly after typing.
    const liveValue = inputRef.current?.value ?? input;
    const word = liveValue.trim().toUpperCase();
    if (!word) return;

    setIsSubmitting(true);

    try {
      const result = await onSubmitGuess(word);
      setInput("");

      if (result) {
        if (result.valid) {
          setFeedback({ type: "correct", message: `+${result.reward}` });
        } else if (result.reason === "already_found") {
          setFeedback({ type: "info", message: "Already found!" });
        } else {
          setFeedback({ type: "wrong", message: "Not a valid word" });
        }
        setTimeout(() => setFeedback(null), 1500);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.label}>👤 YOU</span>
        <span style={styles.score}>{score}</span>
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value.toUpperCase())}
          placeholder={disabled ? "Time's up!" : "Type a word..."}
          disabled={disabled}
          style={{
            ...styles.input,
            opacity: disabled ? 0.4 : 1,
          }}
          autoFocus
          autoComplete="off"
          spellCheck="false"
        />
        <button
          type="submit"
          disabled={disabled || isSubmitting || !input.trim()}
          style={styles.submitBtn}
        >
          →
        </button>
      </form>

      {/* Feedback flash */}
      {feedback && (
        <div style={{
          ...styles.feedback,
          color: feedback.type === "correct" ? "var(--green)"
            : feedback.type === "wrong" ? "var(--red)" : "var(--cyan)",
        }}>
          {feedback.message}
        </div>
      )}

      {/* Found words */}
      <div style={styles.wordList}>
        {found.map((g, i) => (
          <span key={i} style={styles.wordTagGreen}>
            {g.word} <span style={styles.rewardSmall}>+{g.reward}</span>
          </span>
        ))}
      </div>

      {/* Wrong guesses */}
      {wrong.length > 0 && (
        <div style={styles.wrongList}>
          {wrong.slice(-3).map((w, i) => (
            <span key={i} style={styles.wordTagRed}>{w.word}</span>
          ))}
        </div>
      )}

      <div style={styles.stats}>
        {found.length} found {letters && `/ ${letters.word_count || "?"}`}
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
    color: "var(--cyan)",
    letterSpacing: "2px",
  },
  score: {
    fontFamily: "var(--font-mono)",
    fontSize: "28px",
    fontWeight: 800,
    color: "var(--amber)",
  },
  form: {
    display: "flex",
    gap: "8px",
  },
  input: {
    flex: 1,
    padding: "12px 16px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid var(--border-glow)",
    borderRadius: "var(--radius-md)",
    fontFamily: "var(--font-mono)",
    fontSize: "18px",
    fontWeight: 600,
    color: "var(--text-primary)",
    letterSpacing: "3px",
    outline: "none",
    textTransform: "uppercase",
    transition: "border-color 0.2s",
  },
  submitBtn: {
    padding: "12px 20px",
    background: "linear-gradient(135deg, var(--cyan), #05c494)",
    color: "#0a0e1a",
    border: "none",
    borderRadius: "var(--radius-md)",
    fontFamily: "var(--font-mono)",
    fontSize: "18px",
    fontWeight: 700,
    cursor: "pointer",
  },
  feedback: {
    fontFamily: "var(--font-mono)",
    fontSize: "13px",
    fontWeight: 600,
    textAlign: "center",
    animation: "fadeIn 0.2s ease-out",
  },
  wordList: {
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
  },
  wordTagGreen: {
    fontFamily: "var(--font-mono)",
    fontSize: "13px",
    padding: "4px 12px",
    borderRadius: "4px",
    background: "rgba(52, 211, 153, 0.12)",
    border: "1px solid rgba(52, 211, 153, 0.3)",
    color: "var(--green)",
  },
  rewardSmall: {
    fontSize: "10px",
    opacity: 0.7,
  },
  wrongList: {
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
  },
  wordTagRed: {
    fontFamily: "var(--font-mono)",
    fontSize: "12px",
    padding: "3px 10px",
    borderRadius: "4px",
    background: "rgba(248, 113, 113, 0.08)",
    border: "1px solid rgba(248, 113, 113, 0.2)",
    color: "var(--red)",
    opacity: 0.6,
    textDecoration: "line-through",
  },
  stats: {
    marginTop: "auto",
    fontFamily: "var(--font-mono)",
    fontSize: "11px",
    color: "var(--text-dim)",
    letterSpacing: "1px",
  },
};
