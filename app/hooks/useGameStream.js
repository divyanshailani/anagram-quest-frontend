"use client";

import { useState, useCallback, useRef } from "react";

const GAME_SERVER = process.env.NEXT_PUBLIC_GAME_SERVER || "http://127.0.0.1:8000";

/**
 * useGameStream — SSE hook for "Watch AI Play"
 *
 * Connects to /stream-ai-play via EventSource and parses
 * typed events into React state for the three UI panels.
 */
export function useGameStream() {
  const [status, setStatus] = useState("idle"); // idle | connecting | playing | finished | error
  const [events, setEvents] = useState([]);     // raw event log
  const [thinking, setThinking] = useState([]); // AI terminal monologue
  const [guesses, setGuesses] = useState([]);   // per-level guess results
  const [levels, setLevels] = useState([]);      // level summaries
  const [currentLevel, setCurrentLevel] = useState(null);
  const [score, setScore] = useState(0);
  const [bank, setBank] = useState(0);
  const [gameResult, setGameResult] = useState(null);
  const [bankDecisions, setBankDecisions] = useState([]);
  const esRef = useRef(null);

  const startGame = useCallback(() => {
    // Reset all state
    setStatus("connecting");
    setEvents([]);
    setThinking([]);
    setGuesses([]);
    setLevels([]);
    setCurrentLevel(null);
    setScore(0);
    setBank(0);
    setGameResult(null);
    setBankDecisions([]);

    const es = new EventSource(`${GAME_SERVER}/stream-ai-play`);
    esRef.current = es;

    es.onopen = () => setStatus("playing");
    es.onerror = () => {
      setStatus("error");
      es.close();
    };

    // ── Event Handlers ──
    es.addEventListener("game_start", (e) => {
      const data = JSON.parse(e.data);
      setEvents((prev) => [...prev, { type: "game_start", ...data }]);
      setThinking((prev) => [...prev, {
        text: `▸ Game initialized — ${data.total_groups} anagram groups loaded`,
        phase: "system", ts: Date.now(),
      }]);
    });

    es.addEventListener("level_start", (e) => {
      const data = JSON.parse(e.data);
      setCurrentLevel(data);
      setGuesses([]);
      setBank(data.bank);
      setEvents((prev) => [...prev, { type: "level_start", ...data }]);
      setThinking((prev) => [...prev, {
        text: `\n═══ LEVEL ${data.level} ═══`,
        phase: "level", ts: Date.now(),
      }]);
    });

    es.addEventListener("thinking", (e) => {
      const data = JSON.parse(e.data);
      setThinking((prev) => [...prev, { ...data, ts: Date.now() }]);
      setEvents((prev) => [...prev, { type: "thinking", ...data }]);
    });

    es.addEventListener("ai_guess", (e) => {
      const data = JSON.parse(e.data);
      setGuesses((prev) => [...prev, data]);
      if (data.correct) {
        setScore((prev) => +(prev + data.reward).toFixed(1));
      }
      setEvents((prev) => [...prev, { type: "ai_guess", ...data }]);
    });

    es.addEventListener("bank_decision", (e) => {
      const data = JSON.parse(e.data);
      if (data.action === "earn_preserve") {
        setBank(data.bank_total);
      }
      setBankDecisions((prev) => [...prev, data]);
      setEvents((prev) => [...prev, { type: "bank_decision", ...data }]);
      setThinking((prev) => [...prev, {
        text: `[MDP] → ${data.action === "earn_preserve" ? "PRESERVE" : "CURRENT"} (EV: ${data.ev})`,
        phase: "banking", ts: Date.now(),
      }]);
    });

    es.addEventListener("recovery_start", (e) => {
      const data = JSON.parse(e.data);
      setBank(data.bank_remaining);
      setEvents((prev) => [...prev, { type: "recovery_start", ...data }]);
    });

    es.addEventListener("recovery_result", (e) => {
      const data = JSON.parse(e.data);
      if (data.success) {
        setScore((prev) => +(prev + 0.5).toFixed(1));
      }
      setEvents((prev) => [...prev, { type: "recovery_result", ...data }]);
      setThinking((prev) => [...prev, {
        text: data.success
          ? `[Recovery] ✅ Recovered "${data.word}" (+0.5)`
          : `[Recovery] ❌ Failed (needed "${data.target_word}")`,
        phase: "recovery", ts: Date.now(),
      }]);
    });

    es.addEventListener("level_end", (e) => {
      const data = JSON.parse(e.data);
      setLevels((prev) => [...prev, data]);
      setScore(data.total_reward);
      setEvents((prev) => [...prev, { type: "level_end", ...data }]);
    });

    es.addEventListener("game_over", (e) => {
      const data = JSON.parse(e.data);
      setGameResult(data);
      setScore(data.total_reward);
      setStatus("finished");
      setEvents((prev) => [...prev, { type: "game_over", ...data }]);
      es.close();
    });

    es.addEventListener("error", (e) => {
      const data = JSON.parse(e.data);
      setThinking((prev) => [...prev, {
        text: `[ERROR] ${data.message}`,
        phase: "error", ts: Date.now(),
      }]);
    });
  }, []);

  const stopGame = useCallback(() => {
    if (esRef.current) {
      esRef.current.close();
      setStatus("idle");
    }
  }, []);

  return {
    status, events, thinking, guesses, levels,
    currentLevel, score, bank, gameResult, bankDecisions,
    startGame, stopGame,
  };
}
