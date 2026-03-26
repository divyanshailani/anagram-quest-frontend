"use client";

import { useState, useCallback, useRef, useEffect } from "react";

const GAME_SERVER = process.env.NEXT_PUBLIC_GAME_SERVER || "http://127.0.0.1:8000";
const LEVEL_DURATION = 60; // seconds per level

/**
 * useMatchEngine — Hook for Player vs AI mode
 *
 * Manages match creation, human guesses, AI SSE drip-feed,
 * per-level timers, and score tracking for both sides.
 */
export function useMatchEngine() {
  const [matchId, setMatchId] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | playing | level_end | finished | error
  const [currentLevel, setCurrentLevel] = useState(null);
  const [timer, setTimer] = useState(LEVEL_DURATION);

  // Human state
  const [humanScore, setHumanScore] = useState(0);
  const [humanFound, setHumanFound] = useState([]);
  const [humanWrong, setHumanWrong] = useState([]);

  // AI state
  const [aiScore, setAiScore] = useState(0);
  const [aiFound, setAiFound] = useState([]);
  const [aiThinking, setAiThinking] = useState([]);

  // Match results
  const [levelResults, setLevelResults] = useState([]);
  const [matchResult, setMatchResult] = useState(null);

  // Sound event
  const [soundEvent, setSoundEvent] = useState(null);

  // Refs for async access (avoid stale closures)
  const matchIdRef = useRef(null);
  const statusRef = useRef("idle");
  const timerRef = useRef(null);
  const esRef = useRef(null);

  // Keep refs in sync
  useEffect(() => { matchIdRef.current = matchId; }, [matchId]);
  useEffect(() => { statusRef.current = status; }, [status]);

  // ─── Timer ───
  useEffect(() => {
    if (status !== "playing") return;

    timerRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          // Trigger level timeout
          handleLevelTimeoutAsync();
          return 0;
        }
        if (prev <= 10) {
          setSoundEvent({ type: "tick", ts: Date.now() });
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Level timeout → advance ───
  const handleLevelTimeoutAsync = useCallback(async () => {
    const id = matchIdRef.current;
    if (!id) return;

    setStatus("level_end");

    // Close AI stream
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }

    // Small pause for user to see results
    await new Promise((r) => setTimeout(r, 3000));

    try {
      const resp = await fetch(`${GAME_SERVER}/match/${id}/next-level`, { method: "POST" });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();

      if (data.game_over) {
        setMatchResult(data);
        setLevelResults(data.level_results || []);
        setStatus("finished");
        setSoundEvent({ type: "win", ts: Date.now() });
      } else {
        setLevelResults(data.level_results || []);
        startLevelWithId(id, data);
      }
    } catch (err) {
      console.error("next-level error:", err);
      setStatus("error");
    }
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Start a level (pass matchId explicitly) ───
  const startLevelWithId = useCallback((id, levelData) => {
    if (!levelData.letters) {
      console.error("No letters in level data:", levelData);
      setStatus("error");
      return;
    }

    setCurrentLevel({
      level: levelData.level,
      letters: levelData.letters,
      word_count: levelData.word_count,
    });
    setHumanFound([]);
    setHumanWrong([]);
    setAiFound([]);
    setAiThinking([]);
    setTimer(LEVEL_DURATION);
    setStatus("playing");
    setSoundEvent({ type: "levelUp", ts: Date.now() });

    // Connect AI SSE stream — pass id explicitly
    connectAIStreamWithId(id);
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Connect AI drip-feed SSE (pass matchId explicitly) ───
  const connectAIStreamWithId = useCallback((id) => {
    if (esRef.current) esRef.current.close();

    const url = `${GAME_SERVER}/match/${id}/ai-stream`;
    const es = new EventSource(url);
    esRef.current = es;

    es.addEventListener("ai_thinking", (e) => {
      try {
        const data = JSON.parse(e.data);
        setAiThinking((prev) => [...prev, { ...data, ts: Date.now() }]);
      } catch {}
    });

    es.addEventListener("ai_guess", (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.correct) {
          setAiFound((prev) => [...prev, data]);
          setAiScore(data.ai_score);
        }
      } catch {}
    });

    es.addEventListener("ai_level_done", (e) => {
      try {
        const data = JSON.parse(e.data);
        setAiScore(data.ai_score);
      } catch {}
    });

    es.addEventListener("ai_error", (e) => {
      try {
        const data = JSON.parse(e.data);
        setAiThinking((prev) => [...prev, {
          text: `[ERROR] ${data.message}`, phase: "error", ts: Date.now(),
        }]);
      } catch {}
    });

    es.onerror = () => {
      // Don't crash — AI stream may end naturally
    };
  }, []);

  // ─── Create match ───
  const createMatch = useCallback(async () => {
    setStatus("playing");
    setHumanScore(0);
    setAiScore(0);
    setLevelResults([]);
    setMatchResult(null);
    setSoundEvent({ type: "gameStart", ts: Date.now() });

    try {
      const resp = await fetch(`${GAME_SERVER}/match/create`, { method: "POST" });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();

      if (!data.match_id || !data.letters) {
        throw new Error("Invalid match response");
      }

      // Store matchId in both state and ref
      const id = data.match_id;
      setMatchId(id);
      matchIdRef.current = id;

      // Start level 1 — pass id explicitly to avoid stale closure
      startLevelWithId(id, data);
    } catch (err) {
      console.error("createMatch error:", err);
      setStatus("error");
    }
  }, [startLevelWithId]);

  // ─── Submit human guess ───
  const submitGuess = useCallback(async (word) => {
    const id = matchIdRef.current;
    if (!id || statusRef.current !== "playing") return null;

    try {
      const resp = await fetch(`${GAME_SERVER}/match/${id}/guess`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word }),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();

      if (data.valid) {
        setHumanFound((prev) => [...prev, data]);
        setHumanScore(data.human_score);
        setSoundEvent({ type: "correct", ts: Date.now() });

        if (data.all_found) {
          setSoundEvent({ type: "bankCoin", ts: Date.now() });
        }
      } else {
        setHumanWrong((prev) => [...prev, { word: data.word, reason: data.reason }]);
        if (data.reason !== "already_found") {
          setSoundEvent({ type: "wrong", ts: Date.now() });
        }
      }

      return data;
    } catch (err) {
      console.error("submitGuess error:", err);
      return null;
    }
  }, []);

  // ─── Stop match ───
  const stopMatch = useCallback(() => {
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }
    clearInterval(timerRef.current);
    setStatus("idle");
    setMatchId(null);
    matchIdRef.current = null;
  }, []);

  return {
    matchId, status, currentLevel, timer,
    humanScore, humanFound, humanWrong,
    aiScore, aiFound, aiThinking,
    levelResults, matchResult, soundEvent,
    createMatch, submitGuess, stopMatch,
  };
}
