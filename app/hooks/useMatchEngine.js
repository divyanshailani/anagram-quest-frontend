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
  const [humanBank, setHumanBank] = useState(0);
  const [humanFound, setHumanFound] = useState([]);
  const [humanWrong, setHumanWrong] = useState([]);

  // AI state
  const [aiScore, setAiScore] = useState(0);
  const [aiBank, setAiBank] = useState(0);
  const [aiFound, setAiFound] = useState([]);
  const [aiThinking, setAiThinking] = useState([]);
  const [bankFeed, setBankFeed] = useState([]);
  const [bankBusy, setBankBusy] = useState(false);

  // Match results
  const [levelResults, setLevelResults] = useState([]);
  const [matchResult, setMatchResult] = useState(null);
  const [levelEndMeta, setLevelEndMeta] = useState(null); // { reason: "timeout" | "completed", winner: "human" | "ai" | "tie" | null }

  // Sound event
  const [soundEvent, setSoundEvent] = useState(null);

  // Refs for async access (avoid stale closures)
  const matchIdRef = useRef(null);
  const statusRef = useRef("idle");
  const timerRef = useRef(null);
  const esRef = useRef(null);
  const aiReconnectTimerRef = useRef(null);
  const isAdvancingRef = useRef(false);

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
  const handleLevelTimeoutAsync = useCallback(async (reason = "timeout", winner = null) => {
    const id = matchIdRef.current;
    if (!id || isAdvancingRef.current) return;
    isAdvancingRef.current = true;
    setLevelEndMeta({ reason, winner });

    setStatus("level_end");

    // Close AI stream
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }
    if (aiReconnectTimerRef.current) {
      clearTimeout(aiReconnectTimerRef.current);
      aiReconnectTimerRef.current = null;
    }

    // Quick transition on early completion; longer pause when timer expires.
    const pauseMs = reason === "completed" ? 900 : 3000;
    await new Promise((r) => setTimeout(r, pauseMs));

    try {
      const resp = await fetch(`${GAME_SERVER}/match/${id}/next-level`, { method: "POST" });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();

      if (data.game_over) {
        setMatchResult(data);
        setLevelResults(data.level_results || []);
        setHumanBank(data.human_bank ?? 0);
        setAiBank(data.ai_bank ?? 0);
        setBankFeed([...(data.human_bank_log || []), ...(data.ai_bank_log || [])]);
        setStatus("finished");
        setSoundEvent({ type: "win", ts: Date.now() });
      } else {
        setLevelResults(data.level_results || []);
        setHumanBank(data.human_bank ?? 0);
        setAiBank(data.ai_bank ?? 0);
        setBankFeed([...(data.human_bank_log || []), ...(data.ai_bank_log || [])]);
        startLevelWithId(id, data);
      }
    } catch (err) {
      console.error("next-level error:", err);
      setStatus("error");
    } finally {
      isAdvancingRef.current = false;
    }
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Auto-advance when either side completes the level ───
  useEffect(() => {
    if (status !== "playing" || !currentLevel || isAdvancingRef.current) return;

    const humanDone = humanFound.length >= currentLevel.word_count;
    const aiDone = aiFound.length >= currentLevel.word_count;
    if (humanDone || aiDone) {
      const winner = humanDone && aiDone ? "tie" : humanDone ? "human" : "ai";
      clearInterval(timerRef.current);
      handleLevelTimeoutAsync("completed", winner);
    }
  }, [humanFound.length, aiFound.length, currentLevel, status, handleLevelTimeoutAsync]);

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
    setHumanBank(levelData.human_bank ?? 0);
    setAiBank(levelData.ai_bank ?? 0);
    setHumanFound([]);
    setHumanWrong([]);
    setAiFound([]);
    setAiThinking([{
      text: "[System] Syncing AI stream...",
      phase: "boot",
      ts: Date.now(),
    }]);
    setTimer(LEVEL_DURATION);
    setLevelEndMeta(null);
    isAdvancingRef.current = false;
    setStatus("playing");
    setSoundEvent({ type: "levelUp", ts: Date.now() });

    // Connect AI SSE stream — pass id explicitly
    connectAIStreamWithId(id);
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Connect AI drip-feed SSE (pass matchId explicitly) ───
  const connectAIStreamWithId = useCallback((id, attempt = 0) => {
    if (aiReconnectTimerRef.current) {
      clearTimeout(aiReconnectTimerRef.current);
      aiReconnectTimerRef.current = null;
    }
    if (esRef.current) esRef.current.close();

    const url = `${GAME_SERVER}/match/${id}/ai-stream`;
    const es = new EventSource(url);
    esRef.current = es;

    es.onopen = () => {
      if (attempt > 0) {
        setAiThinking((prev) => [...prev, {
          text: "[NET] AI stream reconnected.",
          phase: "net",
          ts: Date.now(),
        }]);
      }
    };

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
        } else {
          setAiThinking((prev) => [...prev, {
            text: "[LLM Solver] Rejecting non-valid candidate...",
            phase: "prune",
            ts: Date.now(),
          }]);
        }
        if (typeof data.ai_bank === "number") {
          setAiBank(data.ai_bank);
        }
        if (data.bank_event) {
          setBankFeed((prev) => [...prev.slice(-7), data.bank_event]);
          setSoundEvent({ type: "bankCoin", ts: Date.now() });
        }
      } catch {}
    });

    es.addEventListener("ai_level_done", (e) => {
      try {
        const data = JSON.parse(e.data);
        setAiScore(data.ai_score);
        if (typeof data.ai_bank === "number") {
          setAiBank(data.ai_bank);
        }
        if (Array.isArray(data.ai_bank_log) && data.ai_bank_log.length > 0) {
          setBankFeed((prev) => [...prev.slice(-4), ...data.ai_bank_log.slice(-4)]);
        }
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
      // Manual reconnect gives us predictable recovery + UI signal.
      if (statusRef.current !== "playing") return;
      if (esRef.current !== es) return;

      es.close();
      esRef.current = null;
      const retryMs = Math.min(700 * (2 ** attempt), 3500);
      setAiThinking((prev) => [...prev, {
        text: `[NET] AI stream dropped. Reconnecting in ${Math.round(retryMs / 1000)}s...`,
        phase: "net",
        ts: Date.now(),
      }]);

      aiReconnectTimerRef.current = setTimeout(() => {
        if (statusRef.current === "playing") {
          connectAIStreamWithId(id, attempt + 1);
        }
      }, retryMs);
    };
  }, []);

  // ─── Create match ───
  const createMatch = useCallback(async () => {
    isAdvancingRef.current = false;
    if (aiReconnectTimerRef.current) {
      clearTimeout(aiReconnectTimerRef.current);
      aiReconnectTimerRef.current = null;
    }
    setLevelEndMeta(null);
    setStatus("playing");
    setHumanScore(0);
    setHumanBank(0);
    setAiScore(0);
    setAiBank(0);
    setBankFeed([]);
    setBankBusy(false);
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
      if (typeof data.human_bank === "number") {
        setHumanBank(data.human_bank);
      }

      if (data.valid) {
        setHumanFound((prev) => [...prev, data]);
        setHumanScore(data.human_score);
        setSoundEvent({ type: "correct", ts: Date.now() });

        if (data.bank_awarded || data.all_found) {
          setSoundEvent({ type: "bankCoin", ts: Date.now() });
        }
        if (data.bank_event) {
          setBankFeed((prev) => [...prev.slice(-7), data.bank_event]);
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

  const useBankBoost = useCallback(async () => {
    const id = matchIdRef.current;
    if (!id || statusRef.current !== "playing" || bankBusy) return null;
    setBankBusy(true);
    try {
      const resp = await fetch(`${GAME_SERVER}/match/${id}/bank/boost`, { method: "POST" });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.detail || `HTTP ${resp.status}`);
      setHumanBank(data.human_bank ?? 0);
      setHumanScore(data.human_score ?? humanScore);
      if (data.bank_event) {
        setBankFeed((prev) => [...prev.slice(-7), data.bank_event]);
      }
      setSoundEvent({ type: "bankCoin", ts: Date.now() });
      return data;
    } catch (err) {
      console.error("bank/boost error:", err);
      return null;
    } finally {
      setBankBusy(false);
    }
  }, [bankBusy, humanScore]);

  const useBankRecover = useCallback(async () => {
    const id = matchIdRef.current;
    if (!id || statusRef.current !== "playing" || bankBusy) return null;
    setBankBusy(true);
    try {
      const resp = await fetch(`${GAME_SERVER}/match/${id}/bank/recover`, { method: "POST" });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.detail || `HTTP ${resp.status}`);
      setHumanBank(data.human_bank ?? 0);
      setHumanScore(data.human_score ?? humanScore);
      if (data.bank_event) {
        setBankFeed((prev) => [...prev.slice(-7), data.bank_event]);
      }
      if (data.success && data.target_word) {
        setLevelResults((prev) =>
          prev.map((row) => {
            if (!Array.isArray(row.human_missed) || !row.human_missed.includes(data.target_word)) {
              return row;
            }
            const updatedMissed = row.human_missed.filter((word) => word !== data.target_word);
            return {
              ...row,
              human_missed: updatedMissed,
            };
          }),
        );
      }
      setSoundEvent({ type: data.success ? "correct" : "wrong", ts: Date.now() });
      return data;
    } catch (err) {
      console.error("bank/recover error:", err);
      return null;
    } finally {
      setBankBusy(false);
    }
  }, [bankBusy, humanScore]);

  // ─── Stop match ───
  const stopMatch = useCallback(() => {
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }
    if (aiReconnectTimerRef.current) {
      clearTimeout(aiReconnectTimerRef.current);
      aiReconnectTimerRef.current = null;
    }
    clearInterval(timerRef.current);
    isAdvancingRef.current = false;
    setStatus("idle");
    setBankBusy(false);
    setHumanBank(0);
    setAiBank(0);
    setBankFeed([]);
    setMatchId(null);
    matchIdRef.current = null;
  }, []);

  return {
    matchId, status, currentLevel, timer,
    humanScore, humanBank, humanFound, humanWrong,
    aiScore, aiBank, aiFound, aiThinking,
    levelResults, matchResult, soundEvent,
    levelEndMeta, bankFeed, bankBusy,
    createMatch, submitGuess, useBankBoost, useBankRecover, stopMatch,
  };
}
