import { getGlobalSettings } from "../services/firebaseService";

/**
 * Play a high-quality, elegant, and premium success sound effect (cha-ching/success chime)
 * meticulously synthesized on-the-fly using the Web Audio API.
 * This ensures lightning-fast performance, zero external asset dependencies, 
 * and perfect compatibility across modern desktop and mobile browsers.
 */
export async function playSuccessSound() {
  try {
    const settings = await getGlobalSettings();
    // Default to true (active) if the setting hasn't been explicitly configured yet
    if (settings && settings.sound_notifications_active === false) {
      return; 
    }
  } catch (error) {
    console.error("Failed to read sound notification settings, playing by default:", error);
  }

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // Master volume set to 0.15 (moderate, elegant, eye/ear saver volume)
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.12, now);
    masterGain.connect(ctx.destination);

    // ==========================================
    // HARMONIC BELL RING (Prismatic "Cha-Ching" sound starter)
    // ==========================================
    const bellOsc = ctx.createOscillator();
    const bellGain = ctx.createGain();
    bellOsc.type = "sine";
    bellOsc.frequency.setValueAtTime(1400, now);
    bellOsc.frequency.exponentialRampToValueAtTime(1800, now + 0.08);
    bellGain.gain.setValueAtTime(0.4, now);
    bellGain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
    
    bellOsc.connect(bellGain);
    bellGain.connect(masterGain);

    const metalOsc = ctx.createOscillator();
    const metalGain = ctx.createGain();
    metalOsc.type = "triangle";
    metalOsc.frequency.setValueAtTime(2800, now);
    metalGain.gain.setValueAtTime(0.15, now);
    metalGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    metalOsc.connect(metalGain);
    metalGain.connect(masterGain);

    // ==========================================
    // SMOOTH CELESTIAL ASCENDING ARPEGGIO CHORD 
    // ==========================================
    // Note 1: C6 (1046.50 Hz) for a warm and firm foundation
    const chord1Osc = ctx.createOscillator();
    const chord1Gain = ctx.createGain();
    chord1Osc.type = "sine";
    chord1Osc.frequency.setValueAtTime(1046.50, now + 0.05);
    chord1Gain.gain.setValueAtTime(0.35, now + 0.05);
    chord1Gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
    chord1Osc.connect(chord1Gain);
    chord1Gain.connect(masterGain);

    // Note 2: E6 (1318.51 Hz) contributing sweet harmonic color
    const chord2Osc = ctx.createOscillator();
    const chord2Gain = ctx.createGain();
    chord2Osc.type = "sine";
    chord2Osc.frequency.setValueAtTime(1318.51, now + 0.11);
    chord2Gain.gain.setValueAtTime(0.35, now + 0.11);
    chord2Gain.gain.exponentialRampToValueAtTime(0.01, now + 0.55);
    chord2Osc.connect(chord2Gain);
    chord2Gain.connect(masterGain);

    // Note 3: G6 (1567.98 Hz) giving the grand, bright resolution
    const chord3Osc = ctx.createOscillator();
    const chord3Gain = ctx.createGain();
    chord3Osc.type = "sine";
    chord3Osc.frequency.setValueAtTime(1567.98, now + 0.17);
    chord3Gain.gain.setValueAtTime(0.45, now + 0.17);
    chord3Gain.gain.exponentialRampToValueAtTime(0.01, now + 0.75);
    chord3Osc.connect(chord3Gain);
    chord3Gain.connect(masterGain);

    // Starting audio nodes
    bellOsc.start(now);
    bellOsc.stop(now + 0.4);

    metalOsc.start(now);
    metalOsc.stop(now + 0.2);

    chord1Osc.start(now + 0.05);
    chord1Osc.stop(now + 0.5);

    chord2Osc.start(now + 0.11);
    chord2Osc.stop(now + 0.6);

    chord3Osc.start(now + 0.17);
    chord3Osc.stop(now + 0.8);

  } catch (err) {
    console.error("Audio Synthesis error:", err);
  }
}
