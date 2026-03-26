"use client";

import { useCallback, useRef } from "react";

/**
 * useSoundFX — Programmatic game sounds via Web Audio API
 *
 * No audio files needed. Generates tones mathematically.
 * All sounds are short, non-intrusive, and cyberpunk-themed.
 */
export function useSoundFX() {
  const ctxRef = useRef(null);

  // Lazily create AudioContext (must be triggered by user gesture)
  const getCtx = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    // Resume if suspended (autoplay policy)
    if (ctxRef.current.state === "suspended") {
      ctxRef.current.resume();
    }
    return ctxRef.current;
  }, []);

  // Helper: play a tone
  const playTone = useCallback((freq, duration, type = "sine", volume = 0.15, delay = 0) => {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
    gain.gain.setValueAtTime(volume, ctx.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + duration);
  }, [getCtx]);

  // ─── Sound Effects ───

  /** Correct guess — rising two-note chime */
  const correct = useCallback(() => {
    playTone(523.25, 0.15, "sine", 0.12, 0);     // C5
    playTone(659.25, 0.2, "sine", 0.12, 0.1);     // E5
  }, [playTone]);

  /** Wrong guess — low thud */
  const wrong = useCallback(() => {
    playTone(110, 0.2, "sawtooth", 0.08, 0);      // A2 buzz
  }, [playTone]);

  /** Level transition — ascending arpeggio */
  const levelUp = useCallback(() => {
    playTone(261.63, 0.15, "sine", 0.1, 0);       // C4
    playTone(329.63, 0.15, "sine", 0.1, 0.12);    // E4
    playTone(392.00, 0.15, "sine", 0.1, 0.24);    // G4
    playTone(523.25, 0.25, "triangle", 0.12, 0.36); // C5
  }, [playTone]);

  /** Bank coin earned */
  const bankCoin = useCallback(() => {
    playTone(783.99, 0.12, "sine", 0.1, 0);       // G5
    playTone(1046.50, 0.15, "sine", 0.08, 0.08);  // C6
  }, [playTone]);

  /** Victory / perfect game — chord + arpeggio */
  const win = useCallback(() => {
    // Major chord
    playTone(261.63, 0.4, "sine", 0.08, 0);       // C4
    playTone(329.63, 0.4, "sine", 0.08, 0);       // E4
    playTone(392.00, 0.4, "sine", 0.08, 0);       // G4
    // Rising finish
    playTone(523.25, 0.2, "triangle", 0.1, 0.3);  // C5
    playTone(659.25, 0.2, "triangle", 0.1, 0.45); // E5
    playTone(783.99, 0.35, "sine", 0.12, 0.6);    // G5
  }, [playTone]);

  /** Countdown tick — soft blip */
  const tick = useCallback(() => {
    playTone(880, 0.06, "sine", 0.06, 0);          // A5 short
  }, [playTone]);

  /** Game start — power-up swoosh */
  const gameStart = useCallback(() => {
    playTone(220, 0.15, "sawtooth", 0.06, 0);     // A3
    playTone(440, 0.15, "sine", 0.08, 0.1);       // A4
    playTone(880, 0.2, "sine", 0.1, 0.2);         // A5
  }, [playTone]);

  return { correct, wrong, levelUp, bankCoin, win, tick, gameStart };
}
