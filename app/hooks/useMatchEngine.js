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
  const [currentLevel, setCurrentLevel] = useState(null); // { level, letters, word_count }
  const [timer, setTimer] = useState(LEVEL_DURATION);

  // Human state
  const [humanScore, setHumanScore] = useState(0);
  const [humanFound, setHumanFound] = useState([]);   // [{word, reward, first_try}]
  const [humanWrong, setHumanWrong] = useState([]);    // [{word, reason}]

  // AI state
  const [aiScore, setAiScore] = useState(0);
  const [aiFound, setAiFound] = useState([]);          // [{word, reward, first_try}]
  const [aiThinking, setAiThinking] = useState([]);    // terminal log entries

  // Match results
  const [levelResults, setLevelResults] = useState([]);
  const [matchResult, setMatchResult] = useState(null);

  // Sound event (same pattern as useGameStream)
  const [soundEvent, setSoundEvent] = useState(null);

  const timerRef = useRef(null);
  const esRef = useRef(null);

  // ─── Timer ───
  useEffect(() => {
    if (status === "playing" && timer > 0) {
      timerRef.current = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleLevelTimeout();
            return 0;
          }
          if (prev <= 10) {
            setSoundEvent({ type: "tick", ts: Date.now() });
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timerRef.current);
    }
  }, [status, timer > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Level timeout → advance ───
  const handleLevelTimeout = useCallback(async () => {
    if (!matchId) return;
    setStatus("level_end");

    // Close AI stream
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }

    // Small pause for user to see results
    await new Promise((r) => setTimeout(r, 3000));

    // Advance to next level
    try {
      const resp = await fetch(`${GAME_SERVER}/match/${matchId}/next-level`, { method: "POST" });
      const data = await resp.json();

      if (data.game_over) {
        setMatchResult(data);
        setLevelResults(data.level_results || []);
        setStatus("finished");
        setSoundEvent({ type: "win", ts: Date.now() });
      } else {
        setLevelResults(data.level_results || []);
        startLevel(data);
      }
    } catch (err) {
      setStatus("error");
    }
  }, [matchId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Start a level ───
  const startLevel = useCallback((levelData) => {
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

    // Connect AI SSE stream for this level
    connectAIStream(levelData.level);
  }, [matchId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Connect AI drip-feed SSE ───
  const connectAIStream = useCallback((level) => {
    if (esRef.current) esRef.current.close();

    const es = new EventSource(`${GAME_SERVER}/match/${matchId}/ai-stream`);
    esRef.current = es;

    es.addEventListener("ai_thinking", (e) => {
      const data = JSON.parse(e.data);
      setAiThinking((prev) => [...prev, { ...data, ts: Date.now() }]);
    });

    es.addEventListener("ai_guess", (e) => {
      const data = JSON.parse(e.data);
      if (data.correct) {
        setAiFound((prev) => [...prev, data]);
        setAiScore(data.ai_score);
        setSoundEvent({ type: "wrong", ts: Date.now() }); // "wrong" from human perspective
      }
    });

    es.addEventListener("ai_level_done", (e) => {
      const data = JSON.parse(e.data);
      setAiScore(data.ai_score);
    });

    es.addEventListener("ai_error", (e) => {
      const data = JSON.parse(e.data);
      setAiThinking((prev) => [...prev, {
        text: `[ERROR] ${data.message}`, phase: "error", ts: Date.now(),
      }]);
    });

    es.onerror = () => {
      // Don't crash — AI stream may end naturally
    };
  }, [matchId]);

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
      const data = await resp.json();
      setMatchId(data.match_id);

      // Start level 1
      startLevel(data);
    } catch (err) {
      setStatus("error");
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Submit human guess ───
  const submitGuess = useCallback(async (word) => {
    if (!matchId || status !== "playing") return null;

    try {
      const resp = await fetch(`${GAME_SERVER}/match/${matchId}/guess`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word }),
      });
      const data = await resp.json();

      if (data.valid) {
        setHumanFound((prev) => [...prev, data]);
        setHumanScore(data.human_score);
        setSoundEvent({ type: "correct", ts: Date.now() });

        // Check if all words found
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
      return null;
    }
  }, [matchId, status]);

  // ─── Stop match ───
  const stopMatch = useCallback(() => {
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }
    clearInterval(timerRef.current);
    setStatus("idle");
  }, []);

  return {
    matchId, status, currentLevel, timer,
    humanScore, humanFound, humanWrong,
    aiScore, aiFound, aiThinking,
    levelResults, matchResult, soundEvent,
    createMatch, submitGuess, stopMatch,
  };
}
